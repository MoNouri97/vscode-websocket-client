<script lang="ts">
	import { Client } from '@stomp/stompjs';
	import SockJs from 'sockjs-client';
	import Log from './Log.svelte';

	let url = 'http://localhost:8080/chat';
	// let url = 'wss://echo.websocket.org';
	let status: 'not-connected' | 'connected' | 'error' = 'not-connected';
	$: connected = status === 'connected';
	let toSend = '';
	let messages: { msg: string; sent: boolean }[] = [];

	let useSockJs = true;
	let stompClient: Client;
	let socket: WebSocket;
	// sockJS
	let chatUrl = '/app/chat/123';
	let subscribeUrl = '/topic/messages/123';

	const connectSockJs = () => {
		stompClient = new Client({
			webSocketFactory: () => {
				try {
					return new SockJs(url);
				} catch (error) {
					tsVscode.postMessage({ type: 'onError', value: error.message });
				}
			},
		});
		stompClient.onStompError = e => {
			tsVscode.postMessage({ type: 'onError', value: 'STOMP Error' });
		};

		stompClient.onConnect = () => {
			stompClient.subscribe(
				subscribeUrl,
				// `/user/${user.username}/queue/messages`,
				payload => {
					messages = [{ msg: payload.body, sent: false }, ...messages];
				},
			);
			status = 'connected';
		};

		stompClient.activate();
	};

	const connectWebSocket = () => {
		try {
			socket = new WebSocket(url);
		} catch (error) {
			tsVscode.postMessage({ type: 'onError', value: error.message });
		}
		socket.onopen = e => {
			status = 'connected';
		};
		socket.onerror = e => {
			status = 'error';
		};
		socket.onmessage = e => {
			messages = [{ msg: e.data, sent: false }, ...messages];
		};
	};

	const handleConnect = () => {
		if (useSockJs) {
			return connectSockJs();
		}
		connectWebSocket();
	};

	const handleDisconnect = () => {
		status = 'not-connected';
		if (!useSockJs) {
			socket?.close();
			return;
		}
		stompClient.deactivate();
	};

	const handleSend = () => {
		if (!useSockJs) {
			socket?.send(toSend);
		} else {
			stompClient.publish({
				destination: chatUrl,
				body: toSend,
			});
		}
		messages = [{ msg: toSend, sent: true }, ...messages];
		toSend = '';
	};
	const handleClear = () => {
		messages = [];
	};
</script>

<template>
	<div>
		<label class="container">
			<input type="checkbox" bind:checked={useSockJs} />
			Use SockJs-client + STOMPjs
		</label>
		<label class="label">
			URL:
			<input bind:value={url} disabled={connected} />
		</label>
		{#if useSockJs}
			<p>STOMP info :</p>
			<label>
				subscribe Path
				<input type="text" bind:value={subscribeUrl} disabled={connected} />
			</label>
			<label>
				Chat Path
				<input type="text" bind:value={chatUrl} disabled={connected} />
			</label>
		{/if}
		{#if status === 'connected'}
			<button on:click={handleDisconnect}>Disconnect</button>
		{:else}
			<button on:click={handleConnect}>Connect</button>
		{/if}

		<p class={status}>status: {status}</p>

		<p class="label">Message:</p>
		<textarea bind:value={toSend} disabled={!connected} />
		<button on:click={handleSend} disabled={!connected}>Send</button>

		<button on:click={handleClear}>Clear Log</button>
		<Log {messages} />
	</div>
</template>

<style>
	.container {
		display: flex;
		align-items: center;
	}
	.container input {
		width: 20px;
		height: 20px;
		position: relative;
		top: 5px;
		margin-right: 5px;
	}
	div * {
		margin-bottom: 1rem;
	}

	*:disabled {
		opacity: 0.5;
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
</style>
