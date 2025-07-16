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
		onpress = () => null
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
	} = $props();

	let disabled = $derived(locked || hidden);

	// Node Bindings
	let container: HTMLDivElement;
	let thumb: HTMLButtonElement;
	let progressBar: HTMLDivElement;
	let element: HTMLDivElement | null = $state(null);

	// Internal State
	let elementX = $derived.by(() => element?.getBoundingClientRect().left);
	let currentThumb: HTMLButtonElement | null = null;
	let holding = $derived(Boolean(currentThumb));
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
		elementX = element?.getBoundingClientRect().left;
	}

	// Allows both bind:value and on:change for parent value retrieval
	function setValue(newValue: number) {
		value = newValue;
		onchange({ value });
	}

	type MouseOrTouchEvent =
		| (MouseEvent & { type: 'mousedown' | 'mouseup' | 'mousemove' })
		| (TouchEvent & { type: 'touchstart' | 'touchmove' });
	const isTouchEvent = (
		e: MouseOrTouchEvent
	): e is TouchEvent & { type: 'touchstart' | 'touchmove' } => {
		return e.type === 'touchmove' || e.type === 'touchstart';
	};

	function onTrackEvent(e: MouseOrTouchEvent) {
		// Update value immediately before beginning drag
		updateValueOnEvent(e);
		onDragStart(e);
	}

	function onDragStart(e: MouseOrTouchEvent) {
		onpress();

		// If mouse event add a pointer events shield
		if (e.type === 'mousedown') {
			document.body.append(mouseEventShield);
		}

		// TODO: What does this line do?
		currentThumb = thumb;
	}

	function onDragEnd(e: MouseOrTouchEvent) {
		onrelease();

		// If using mouse - remove pointer event shield
		if (e.type === 'mouseup') {
			if (document.body.contains(mouseEventShield)) document.body.removeChild(mouseEventShield);
			// Needed to check whether thumb and mouse overlap after shield removed
			if (isMouseInElement(e, thumb)) thumbHover = true;
		}
		currentThumb = null;
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
		if (keydownAcceleration < 50) keydownAcceleration++;
		let throttled = Math.ceil(keydownAcceleration / 5);

		if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
			setValue(Math.min(value + throttled * step, max));
		}
		if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
			setValue(Math.max(value - throttled * step, min));
		}

		// Reset acceleration after 100ms of no events
		clearTimeout(accelerationTimer ?? undefined);
		accelerationTimer = setTimeout(() => (keydownAcceleration = 1), 100);
	}

	function calculateNewValue(clientX: number) {
		// Find distance between cursor and element's left cord (20px / 2 = 10px) - Center of thumb
		let delta = clientX - (unwrap(elementX) + 10);

		// Use width of the container minus (5px * 2 sides) offset for percent calc
		let percent = delta / (container.clientWidth - 10);

		// Clamp
		percent = Math.max(0, Math.min(percent, 1));

		// Limit value min -> max
		setValue(percent * (max - min) + min);
	}

	// Handles both dragging of touch/mouse as well as simple one-off click/touches
	function updateValueOnEvent(e: MouseOrTouchEvent) {
		// touchstart && mousedown are one-off updates, otherwise expect a currentPointer node
		if (!currentThumb && e.type !== 'touchstart' && e.type !== 'mousedown') return false;

		if (e.stopPropagation) e.stopPropagation();
		if (e.preventDefault) e.preventDefault();

		// Get client's x cord either touch or mouse
		const clientX = isTouchEvent(e) ? e.touches[0].clientX : e.clientX;

		calculateNewValue(clientX);
	}

	// Update progressbar and thumb styles to represent value
	$effect(() => {
		if (progressBar && thumb) {
			// Limit value min -> max
			value = Math.max(min, Math.min(value, max));

			let percent = (value - min) / (max - min);
			let offsetLeft = (container.clientWidth - 10) * percent + 5;

			// Update thumb position + active range track width
			thumb.style.left = `${offsetLeft}px`;
			progressBar.style.width = `${offsetLeft}px`;
		}
	});

	/* `validateTouchEventHandler`
	 * Shortened because it is very commonly used.
	 **/
	function vteh(handler: (e: MouseOrTouchEvent) => void) {
		if (disabled) {
			return () => null;
		}

		const validateTouchEvent = (e: TouchEvent): MouseOrTouchEvent => {
			const typeIsTouch = (type: string): type is 'touchstart' | 'touchmove' =>
				type === 'touchstart' || type === 'touchmove';
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

<div class="range">
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
	<div
		class="wrapper"
		tabindex={0}
		onkeydown={onKeyPress}
		bind:this={element}
		role="slider"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		onmousedown={vmeh(onTrackEvent)}
		ontouchstart={vteh(onTrackEvent)}
	>
		<div class="track" bind:this={container}>
			<div class="track--highlighted" bind:this={progressBar}></div>
			<button
				class="thumb"
				class:thumb--holding={holding}
				bind:this={thumb}
				ontouchstart={vteh(onDragStart)}
				onmousedown={vmeh(onDragStart)}
				onmouseover={() => (thumbHover = true)}
				onfocus={() => (thumbHover = true)}
				onmouseout={() => (thumbHover = false)}
				onblur={() => (thumbHover = false)}
			>
				{#if holding || thumbHover}
					<div class="tooltip" in:fly={{ y: 7, duration: 200 }} out:fade={{ duration: 100 }}>
						{value}
					</div>
				{/if}
			</button>
		</div>
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

	.range {
		position: relative;
	}

	.wrapper {
		min-width: 100%;
		position: relative;
		padding: 0.5rem;
		box-sizing: border-box;
		outline: none;
	}

	.wrapper:focus-visible > .track {
		box-shadow:
			0 0 0 2px white,
			0 0 0 3px var(--track-focus, #6185ff);
	}

	.track {
		height: 6px;
		background-color: var(--track-bgcolor, #d0d0d0);
		border-radius: 999px;
	}

	.track--highlighted {
		background-color: var(--track-highlight-bgcolor, #6185ff);
		background: var(--track-highlight-bg, linear-gradient(90deg, #6185ff, #9c65ff));
		width: 0;
		height: 6px;
		position: absolute;
		border-radius: 999px;
	}

	.thumb {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		width: 20px;
		height: 20px;
		background-color: var(--thumb-bgcolor, white);
		cursor: pointer;
		border-radius: 999px;
		margin-top: -8px;
		transition: box-shadow 100ms;
		user-select: none;
		box-shadow: var(
			--thumb-boxshadow,
			0 1px 1px 0 rgba(0, 0, 0, 0.14),
			0 0px 2px 1px rgba(0, 0, 0, 0.2)
		);
	}

	.thumb--holding {
		box-shadow:
			0 1px 1px 0 rgba(0, 0, 0, 0.14),
			0 1px 2px 1px rgba(0, 0, 0, 0.2),
			0 0 0 6px var(--thumb-holding-outline, rgba(113, 119, 250, 0.3));
	}

	.tooltip {
		pointer-events: none;
		position: absolute;
		top: -33px;
		color: var(--tooltip-text, white);
		width: 38px;
		padding: 4px 0;
		border-radius: 4px;
		text-align: center;
		background-color: var(--tooltip-bgcolor, #6185ff);
		background: var(--tooltip-bg, linear-gradient(45deg, #6185ff, #9c65ff));
	}

	.tooltip::after {
		content: '';
		display: block;
		position: absolute;
		height: 7px;
		width: 7px;
		background-color: var(--tooltip-bgcolor, #6185ff);
		bottom: -3px;
		left: calc(50% - 3px);
		clip-path: polygon(0% 0%, 100% 100%, 0% 100%);
		transform: rotate(-45deg);
		border-radius: 0 0 0 3px;
	}
</style>
