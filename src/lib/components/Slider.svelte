<script lang="ts">
	let {
		value = 0.5,
		disabled = false,
		onpress,
		onrelease
	}: {
		value?: number;
		disabled?: boolean;
		onpress?: () => void;
		onrelease?: () => void;
	} = $props();
</script>

<input
	class="h-8"
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
	{disabled}
/>
