<script lang="ts">
	import { Client } from '@stomp/stompjs';
	import SockJs from 'sockjs-client';

	let url = 'wss://echo.websocket.org';
	let status: 'not-connected' | 'connected' | 'error' = 'not-connected';
	$: connected = status === 'connected';
	let stompClient: Client;
	let toSend = '';
	let messages: { msg: string; sent: boolean }[] = [];
	// console.log({socket})
	const handleConnect = () => {
		stompClient = new Client({
			webSocketFactory: () => {
				return new SockJs(url);
			},
		});
		stompClient.onStompError = () => {
			console.log('socket error');
		};

		stompClient.onConnect = () => {
			stompClient.subscribe(
				'/topic/public',
				// `/user/${user.username}/queue/messages`,
				payload => {
					messages = [...messages, { msg: payload.body, sent: false }];
				},
			);
			connected = true;
			status = 'connected';
		};

		stompClient.activate();

		// socket = new WebSocket(url);
		// socket.onopen = e => {
		// 	connected = true;
		// 	status = 'connected';
		// };

		// socket.onerror = e => {
		// 	connected = false;
		// 	status = 'error';
		// };

		// socket.onmessage = e => {
		// 	messages = [...messages, { msg: e.data, sent: false }];
		// };
	};

	const handleDisconnect = () => {
		// socket?.close();
		stompClient.deactivate();
		status = 'not-connected';
	};

	const handleSend = () => {
		// socket?.send(toSend);
		stompClient.publish({
			destination: '/topic/public',
			body: toSend,
		});
		messages = [...messages, { msg: toSend, sent: true }];
		toSend = '';
	};
</script>

<template>
	<h1>WebSocket Client</h1>
	<div>
		<p class="label">URL:</p>
		<input bind:value={url} placeholder="wss://echo.websocket.org" />

		{#if status === 'connected'}
			<button on:click={handleDisconnect}>Disonnect</button>
		{:else}
			<button on:click={handleConnect}>Connect</button>
		{/if}

		<p class={status}>status: {status}</p>

		<p class="label">Message:</p>
		<input bind:value={toSend} />
		<button on:click={handleSend}>Send</button>

		<p class="label">Log:</p>
		<div class="messages">
			{#each messages as { msg, sent } (msg + sent)}
				<p class:sent>
					{`${sent ? 'SENT:' : 'RECIEVED'}`}
				</p>
				<pre>
					{msg}
				</pre>
				<!-- </p> -->
			{/each}
		</div>
	</div>
</template>

<style>
	h1 {
		font-weight: 900;
	}
	div * {
		margin-bottom: 1rem;
	}

	.connected {
		color: greenyellow;
	}
	.not-connected {
		color: gray;
	}
	.error {
		color: tomato;
	}
	.messages {
		overflow-y: scroll;
	}
	.messages p {
		padding: 1rem;
		margin-bottom: 0;
	}
	.messages p:not(.sent) {
		background: rgba(128, 128, 128, 0.1);
	}
	.sent {
		background: rgba(128, 128, 128, 0.3);
	}
</style>
