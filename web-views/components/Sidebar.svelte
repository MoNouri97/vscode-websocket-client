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
				} catch (error: any) {
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
		} catch (error: any) {
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
		socket.onmessage = async e => {
			let deserializedMessage = e.data;
			try {
				deserializedMessage = await deserialize(e.data);
			} catch(error: any) {
				tsVscode.postMessage({ type: 'onError', value: 'Failed to deserialize message: '+error.message });
			}
			messages = [...messages, { msg: deserializedMessage, sent: false }];
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

	// Enter: Send message, Shift+Enter: New line
	const onToSendTextAreaKeyUp = (evt: KeyboardEvent) => {
		if(evt.key == 'Enter' && !evt.shiftKey) {
            handleSend();
            evt.preventDefault();
        }
	}

	const handleSend = async () => {
		try {
			const serializedMessage = await serialize(toSend);
			if (!useStompJs) {
				socket?.send(serializedMessage);
			} else {
				stompClient.publish({
					destination: chatUrl,
					body: serializedMessage,
				});
			}
			messages = [...messages, { msg: toSend, sent: true }];
			toSend = '';
		} catch(error: any) {
			tsVscode.postMessage({ type: 'onError', value: 'Failed to serialize message: '+error.message });
		}
	};

	const handleClear = () => {
		messages = [];
	};

	async function serialize(text: string): Promise<any> {
		const response = await postRequest({type: 'getSerializer', value: ''});
		const serializerFn = eval(response);
		return serializerFn(text);
	}

	async function deserialize(data: any): Promise<string> {
		const response = await postRequest({type: 'getDeserializer', value: ''});
		const deserializerFn = eval(response);
		return deserializerFn(data);
	}

	function postRequest(msg: { type: string; value: string }): Promise<string> {
		return new Promise((resolve, _reject) => {
			const listener = (evt: MessageEvent) => {
				if(evt.data.type == msg.type+'Response') {
					window.removeEventListener('message', listener);
					resolve(evt.data.value);
				}
			}
			window.addEventListener('message', listener);
			tsVscode.postMessage(msg);
		})
	}
</script>

<template>
	<div id="sidebar">
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

		<Log on:clear={handleClear} {messages} />
		
		<textarea bind:value={toSend} on:keyup={onToSendTextAreaKeyUp} disabled={!connected} />
		<button on:click={handleSend} disabled={!connected}>Send</button>

	</div>
</template>

<style>
	#sidebar {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		overflow: auto;
	}

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
	div label {
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

	textarea {
		min-height: 2em;
	}
</style>
