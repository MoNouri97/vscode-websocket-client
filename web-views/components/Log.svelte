<script lang="ts">
  import { afterUpdate, createEventDispatcher } from "svelte";
  import { MessageType } from "../types";

	export let messages: { msg: string; type: MessageType }[];
	let messageType = MessageType;
	let messagesDiv: HTMLDivElement;

	afterUpdate(() => {
		messagesDiv?.lastElementChild?.scrollIntoView({
			behavior: "smooth",
			block: "end",
			inline: "end"
		});
	})

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
	<div bind:this={messagesDiv} class="messages">
		{#each messages as { msg, type }}
			{#if type == messageType.Status}
				<div class="status">
					{print(msg)}
				</div>
			{:else}
				<div class="message" class:sent="{type == messageType.Sent}">
					<pre>{messageType[type].toUpperCase()}</pre>
					{print(msg)}
				</div>
			{/if}
		{/each}
	</div>
</template>

<style>
	.status {
		text-align: center;
	}

	.messages {
		width: 100%;
		overflow-wrap: anywhere;
		overflow-y: scroll;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		margin: 1em 0 1em 0;
		font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
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
		font-size: xx-small;
	}
	.message:not(.sent) {
		background: rgba(128, 128, 128, 0.1);
		text-align: start;
		align-self: flex-start;
		margin-right: 1em;
	}
	.message.sent {
		background: rgba(128, 128, 128, 0.3);
		text-align: end;
		align-self: flex-end;
		margin-left: 1em;
	}
</style>
