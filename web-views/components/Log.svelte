<script lang="ts">
	export let messages: { msg: string; sent: boolean }[];

	const print = (s: string): string => {
		let obj;
		let ret;
		try {
			obj = JSON.parse(s);
			ret = JSON.stringify(obj, null, 2);
		} catch (error) {
			ret = s;
		}
		return ret;
	};
</script>

<template>
	<p class="label">Log:</p>
	<div class="messages">
		{#each messages as { msg, sent }}
			<pre class:sent>
				{`${sent ? 'SENT:' : 'RECEIVED'}\n${print(msg)}`}
			</pre>
		{/each}
	</div>
</template>

<style>
	.messages {
		overflow-y: scroll;
	}
	.messages pre {
		padding: 1rem;
	}
	.messages pre:not(.sent) {
		background: rgba(128, 128, 128, 0.1);
	}
	.sent {
		background: rgba(128, 128, 128, 0.3);
	}
</style>
