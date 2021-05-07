<script lang="ts">
	import { Client } from '@stomp/stompjs';
	import SockJs from 'sockjs-client';
	import { onMount } from 'svelte';
	import Log from './Log.svelte';

	let url: string;
	// let url = 'wss://echo.websocket.org';
	let status: 'not-connected' | 'connected' | 'error' | 'loading';
	$: connected = status === 'connected';
	let toSend: string;
	let messages: { msg: string; sent: boolean }[] = [];

	let useSockJs: boolean;
	let useStompJs: boolean;
	let stompClient: Client;
	let socket: WebSocket;
	// Stomp-JS
	let chatUrl: string;
	let subscribeUrl: string;

	// state
	$: {
		// socket and StompClient are saved on connect
		if (url != undefined) {
			const state = {
				url,
				useSockJs,
				useStompJs,
				status,
				chatUrl,
				subscribeUrl,
			};
			tsVscode.setState(state);
		}
	}
	onMount(() => {
		const state = tsVscode.getState();
		console.log(state);

		url = state?.url ?? 'http://localhost:8080/chat';
		status = state?.status ?? 'not-connected';
		useSockJs = state?.useSockJs ?? true;
		useStompJs = state?.useStompJs ?? true;
		chatUrl = state?.chatUrl ?? '/app/chat/123';
		subscribeUrl = state?.subscribeUrl ?? '/topic/messages/123';
		if (status == 'connected') {
			handleConnect();
		}
	});

	const connectSTOMP = () => {
		stompClient = new Client({
			brokerURL: url,
			debug: function (str) {
				console.log(str);
			},
			reconnectDelay: 5000,
			heartbeatIncoming: 4000,
			heartbeatOutgoing: 4000,
		});

		stompClient.onStompError = e => {
			status = 'error';
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

		stompClient.onWebSocketClose = () => {
			status = status == 'loading' ? 'error' : 'not-connected';
			if (status == 'not-connected') {
				stompClient.deactivate();
			}
		};

		// sockJs code
		if (useSockJs) {
			stompClient.webSocketFactory = () => {
				try {
					return new SockJs(url) as any;
				} catch (error) {
					tsVscode.postMessage({ type: 'onError', value: error.message });
				}
			};
		}

		stompClient.activate();
	};

	const connectWebSocket = () => {
		try {
			socket = new WebSocket(url);
			console.log(socket);
		} catch (error) {
			tsVscode.postMessage({ type: 'onError', value: error.message });
		}
		socket.onopen = e => {
			status = 'connected';
		};
		socket.onerror = e => {
			status = 'error';
		};
		socket.onclose = e => {
			status = status == 'loading' ? 'error' : 'not-connected';
		};
		socket.onmessage = e => {
			messages = [{ msg: e.data, sent: false }, ...messages];
		};
	};

	const handleConnect = () => {
		status = 'loading';
		if (useStompJs) {
			return connectSTOMP();
		}
		connectWebSocket();
	};

	const handleDisconnect = () => {
		status = 'not-connected';
		if (useStompJs) {
			stompClient.deactivate();
			return;
		}
		socket?.close();
	};

	const handleSend = () => {
		if (!useStompJs) {
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
			<input type="checkbox" bind:checked={useStompJs} />
			Use STOMPjs
		</label>
		{#if useStompJs}
			<label class="container">
				<input type="checkbox" bind:checked={useSockJs} />
				Use SockJs-client
			</label>
		{/if}
		<label class="label">
			URL:
			<input bind:value={url} disabled={connected} />
		</label>
		{#if useStompJs}
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
