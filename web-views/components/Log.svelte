<script lang="ts">
  import { createEventDispatcher } from "svelte";

	export let messages: { msg: string; sent: boolean }[];

	const dispatch = createEventDispatcher();

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

	const handleClear = (evt: Event) => {
		dispatch('clear', evt);
	}
</script>

<template>
	<button on:click={handleClear}>Clear Log</button>
	<div class="messages">
		{#each messages as { msg, sent }}
			<div class="message" class:sent>
				<pre>{sent ? 'SENT' : 'RECEIVED'}</pre>
				{print(msg)}
			</div>
		{/each}
	</div>
</template>

<style>
	.messages {
		width: 100%;
		overflow-y: scroll;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		margin: 1em 0 1em 0
	}

	.message {
		width: fit-content;
		min-width: 6em;
		margin: .25em 0 .25em 0;
		padding: 1em;
		border-radius: 1em;
	}

	.message pre {
		margin: 0;
		color: #999;
	}
	.message:not(.sent) {
		background: rgba(128, 128, 128, 0.1);
		text-align: start;
		align-self: flex-start;
	}
	.message.sent {
		background: rgba(128, 128, 128, 0.3);
		text-align: end;
		align-self: flex-end;
	}
</style>
