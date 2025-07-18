<!-- Modified from https://svelte.dev/playground/7f0042a186ee4d8e949c46ca663dbe6c?version=5.36.2 -->
<script lang="ts">
	import { unwrap } from '$lib/utils';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let {
		min = 0,
		max = 1,
		value = $bindable(0.5),
		step = 0.0001,
		name,
		hidden = false,
		locked = false,
		onchange = () => null,
		onrelease = () => null,
		onpress = () => null,
		marks = []
	}: {
		min?: number;
		max?: number;
		value?: number;
		step?: number;
		name: string;
		hidden?: boolean;
		locked?: boolean;
		onchange?: ({ value }: { value: number }) => void;
		onrelease?: () => void;
		onpress?: () => void;
		marks?: { value: number; label: string }[];
	} = $props();

	// let neon = $derived(!locked);
	// TODO: Looks too bland disabled...
	const neon = true;

	let disabled = $derived(locked || hidden);

	let containerWidth: number | null = $state(null);
	let thumb: HTMLButtonElement;
	let element: HTMLDivElement | null = $state(null);

	let elementLeft = $derived.by(() => element?.getBoundingClientRect().left);
	let holding = $state(false);
	let thumbHover = $state(false);
	let keydownAcceleration = 0;
	let accelerationTimer: NodeJS.Timeout | null = null;

	// Mouse shield used onMouseDown to prevent any mouse events penetrating other elements,
	// ie. hover events on other elements while dragging. Especially for Safari
	let mouseEventShield: HTMLDivElement;
	onMount(() => {
		mouseEventShield = document.createElement('div');
		mouseEventShield.setAttribute('class', 'mouse-over-shield');
		mouseEventShield.addEventListener('mouseover', (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
	});

	function resizeWindow() {
		elementLeft = element?.getBoundingClientRect().left;
	}

	// Allows both `bind:value` and `onchange` for parent value retrieval
	function setValue(newValue: number) {
		value = Math.max(min, Math.min(newValue, max));
		onchange({ value });
	}

	type MouseOrTouchEvent =
		| (MouseEvent & { type: 'mousedown' | 'mouseup' | 'mousemove' })
		| (TouchEvent & { type: 'touchstart' | 'touchend' | 'touchmove' | 'touchcancel' });
	const isTouchEvent = (
		e: MouseOrTouchEvent
	): e is TouchEvent & { type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel' } => {
		return (
			e.type === 'touchmove' ||
			e.type === 'touchstart' ||
			e.type === 'touchend' ||
			e.type === 'touchcancel'
		);
	};

	function onTrackEvent(e: MouseOrTouchEvent) {
		holding = true;
		updateValueOnEvent(e);
		onDragStart(e);
		onpress();
	}

	function onDragStart(e: MouseOrTouchEvent) {
		// If mouse event add a pointer events shield
		if (e.type === 'mousedown') {
			document.body.append(mouseEventShield);
		}
	}

	function onDragEnd(e: MouseOrTouchEvent) {
		if (holding) {
			onrelease();
		}

		// If using mouse - remove pointer event shield
		if (e.type === 'mouseup') {
			if (document.body.contains(mouseEventShield)) {
				document.body.removeChild(mouseEventShield);
			}
			// Needed to check whether thumb and mouse overlap after shield removed
			if (isMouseInElement(e, thumb)) {
				thumbHover = true;
			}
		}

		holding = false;
	}

	// Check if mouse event cords overlay with an element's area
	function isMouseInElement(event: MouseEvent, element: HTMLElement) {
		let rect = element.getBoundingClientRect();
		let { clientX: x, clientY: y } = event;
		if (x < rect.left || x >= rect.right) return false;
		if (y < rect.top || y >= rect.bottom) return false;
		return true;
	}

	// Accessible keypress handling
	function onKeyPress(e: KeyboardEvent) {
		// Max out at +/- 10 to value per event (50 events / 5)
		// 100 below is to increase the amount of events required to reach max velocity
		if (keydownAcceleration < 100) {
			keydownAcceleration += 5;
		}
		let throttled = Math.ceil(keydownAcceleration);

		if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
			setValue(value + throttled * step);
		}
		if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
			setValue(value - throttled * step);
		}

		// Reset acceleration after 100ms of no events
		clearTimeout(accelerationTimer ?? undefined);
		accelerationTimer = setTimeout(() => (keydownAcceleration = 1), 100);
	}

	function calculateNewValue(clientX: number) {
		let percent = (clientX - unwrap(elementLeft)) / unwrap(containerWidth);
		setValue(percent * (max - min) + min);
	}

	// Handles both dragging of touch/mouse as well as simple one-off click/touches
	function updateValueOnEvent(e: MouseOrTouchEvent) {
		// touchstart && mousedown are one-off updates, otherwise expect a currentPointer node
		if (!holding) {
			return false;
		}

		if (e.stopPropagation) e.stopPropagation();
		if (e.preventDefault) e.preventDefault();

		// Get client's x cord either touch or mouse
		const clientX = isTouchEvent(e) ? e.touches[0].clientX : e.clientX;

		calculateNewValue(clientX);
	}

	let percent = $derived((value - min) / (max - min));

	/* `validateTouchEventHandler`
	 * Shortened because it is very commonly used.
	 **/
	function vteh(handler: (e: MouseOrTouchEvent) => void) {
		if (disabled) {
			return () => null;
		}

		const validateTouchEvent = (e: TouchEvent): MouseOrTouchEvent => {
			const typeIsTouch = (
				type: string
			): type is 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel' =>
				type === 'touchstart' ||
				type === 'touchmove' ||
				type === 'touchend' ||
				type === 'touchcancel';
			if (typeIsTouch(e.type)) {
				return e as TouchEvent & { type: typeof e.type };
			}

			throw new Error(`Touch event type is "${e.type}"`);
		};

		return (e: TouchEvent) => handler(validateTouchEvent(e));
	}

	/* `validateMouseEventHandler`
	 * Shortened because it is very commonly used.
	 **/
	function vmeh(handler: (e: MouseOrTouchEvent) => void) {
		if (disabled) {
			return () => null;
		}

		const validateMouseEvent = (e: MouseEvent): MouseOrTouchEvent => {
			const typeIsTouch = (type: string): type is 'mousedown' | 'mouseup' | 'mousemove' =>
				type === 'mousedown' || type === 'mouseup' || type === 'mousemove';
			if (typeIsTouch(e.type)) {
				return e as MouseEvent & { type: typeof e.type };
			}

			throw new Error(`Mouse event type is "${e.type}"`);
		};

		return (e: MouseEvent) => handler(validateMouseEvent(e));
	}
</script>

<svelte:window
	ontouchmove={vteh(updateValueOnEvent)}
	ontouchcancel={vteh(onDragEnd)}
	ontouchend={vteh(onDragEnd)}
	onmousemove={vmeh(updateValueOnEvent)}
	onmouseup={vmeh(onDragEnd)}
	onresize={resizeWindow}
/>

<div
	id="range"
	class="relative px-2 py-4 {hidden && 'grayscale'}"
	onmousedown={vmeh(onTrackEvent)}
	ontouchstart={vteh(onTrackEvent)}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	onkeydown={onKeyPress}
	tabindex={0}
>
	<input
		type="range"
		{value}
		{min}
		{max}
		{step}
		class="hidden"
		{name}
		disabled={hidden || locked}
	/>
	<div class="relative flex" bind:this={element} bind:clientWidth={containerWidth}>
		<div
			id="track-highlighted"
			class={[
				neon && 'neon neon-secondary neon-lg box-neon',
				'bg-glow-secondary-base/90 h-2 rounded-l-full'
			]}
			style:width="{percent * 100}%"
		></div>
		<button
			{disabled}
			id="thumb"
			class={[
				holding ? 'bg-glow-base/50' : 'bg-white-base',
				'absolute top-1/2 flex h-8 w-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl shadow transition select-none',
				neon && 'neon neon-lg box-neon neon-secondary'
			]}
			style:left="{percent * 100}%"
			bind:this={thumb}
			ontouchstart={vteh(onDragStart)}
			onmousedown={vmeh(onDragStart)}
			onmouseover={() => (thumbHover = true)}
			onfocus={() => (thumbHover = true)}
			onmouseout={() => (thumbHover = false)}
			onblur={() => (thumbHover = false)}
			aria-label="range-thumb"
		>
		</button>
		<div
			id="track"
			class={[neon && 'neon neon-md box-neon', 'bg-glow-base/20 h-2 w-full rounded-r-full']}
			style:width="{(1 - percent) * 100}%"
		></div>
		{#each marks as { value: markValue, label }}
			<div
				class={[
					'pointer-events-none absolute top-1/2 -translate-x-1/2 translate-y-3 rounded px-2 py-0',
					'neon neon-lg box-neon',
					markValue < value && 'neon-secondary'
				]}
				in:fly={{ y: 7, duration: 200 }}
				out:fade={{ duration: 100 }}
				style:left="{((markValue - min) / (max - min)) * 100}%"
			>
				{label}
			</div>
		{/each}
	</div>
</div>

<style>
	:global(.mouse-over-shield) {
		position: fixed;
		top: 0px;
		left: 0px;
		height: 100%;
		width: 100%;
		background-color: rgba(255, 0, 0, 0);
		z-index: 10000;
		cursor: grabbing;
	}
</style>
