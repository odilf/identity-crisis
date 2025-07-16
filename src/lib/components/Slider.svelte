<script lang="ts">
	let {
		value = 0.5,
		locked = false,
		hidden = false,
		onpress,
		onrelease,
		class: className
	}: {
		value?: number;
		locked?: boolean;
		hidden?: boolean;
		onpress?: () => void;
		onrelease?: () => void;
		class?: string;
	} = $props();
</script>

<input
	class="h-8 w-full {className}"
	type="range"
	onmousedown={onpress}
	onmouseup={onrelease}
	ontouchstart={onpress}
	ontouchend={onrelease}
	name="value"
	min={0.0}
	max={1.0}
	step={0.0001}
	bind:value
	disabled={locked || hidden}
/>
