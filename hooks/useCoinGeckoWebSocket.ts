'use client';

import { useEffect, useRef, useState } from 'react';

const WS_BASE = `${process.env.NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL}?x_cg_pro_api_key=${process.env.NEXT_PUBLIC_COINGECKO_API_KEY}`;

export const useCoinGeckoWebSocket = ({
	coinId,
	poolId,
	liveInterval
}: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
	const wsRef = useRef<WebSocket | null>(null);
  const subscribed = useRef(new Set<string>());

	const [price, setPrice] = useState<ExtendedPriceData | null>(null);
	const [trades, setTrades] = useState<Trade[]>([]);
	const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);

	const [isWsReady, setIsWsReady] = useState(false);

  // initialize WebSocket connection
	useEffect(() => {
		const ws = new WebSocket(WS_BASE);
		wsRef.current = ws;

		const send = (payload: Record<string, unknown>) =>
			ws.send(JSON.stringify(payload));

		const handleMessage = (event: MessageEvent) => {
			const msg: WebSocketMessage = JSON.parse(event.data);

      // CoinGecko sends a ping every 10 seconds. If the hook doesn't send a pong back within 20 seconds, they will kill your connection.
			if (msg.type === 'ping') {
				send({ type: 'pong' });
				return;
			}

      /* 
      This is the confirmation handshake. When you send a request to CoinGecko to "Subscribe," the server doesn't just start sending prices immediately; it first sends a confirmation message to let you know the request was successful.
      */
			if (msg.type === 'confirm_subscription') {
				const { channel } = JSON.parse(
					msg?.identifier ?? ''
				);
        /* 
        it adds a new item to an existing collection.
        If you subscribe to "bitcoin," then "ethereum," then "solana," your Set will contain all three.
        */
				subscribed.current.add(channel);
			}
      // handle different message channels
      // msg.c is the channel type
      // C1 = price updates, G2 = trades, G3 = OHLCV data
			if (msg.c === 'C1') {
				setPrice({
					usd: msg.p ?? 0,
					coin: msg.i,
					price: msg.p,
					change24h: msg.pp,
					marketCap: msg.m,
					volume24h: msg.v,
					timestamp: msg.t
				});
			}
			if (msg.c === 'G2') {
				const newTrade: Trade = {
					price: msg.pu,
					value: msg.vo,
					timestamp: msg.t ?? 0,
					type: msg.ty,
					amount: msg.to
				};

				setTrades(prev =>
					[newTrade, ...prev].slice(0, 7)
				);
			}
			if (msg.ch === 'G3') {
				const timestamp = msg.t ?? 0;

				const candle: OHLCData = [
					timestamp,
					Number(msg.o ?? 0),
					Number(msg.h ?? 0),
					Number(msg.l ?? 0),
					Number(msg.c ?? 0)
				];

				setOhlcv(candle);
			}
		};

		ws.onopen = () => setIsWsReady(true);

		ws.onmessage = handleMessage;

		ws.onclose = () => setIsWsReady(false);

		ws.onerror = error => {
			setIsWsReady(false);
		};

		return () => ws.close();
	}, []);

	useEffect(() => {
		if (!isWsReady) return;
		const ws = wsRef.current;
		if (!ws) return;

		const send = (payload: Record<string, unknown>) =>
			ws.send(JSON.stringify(payload));

		const unsubscribeAll = () => {
			subscribed.current.forEach(channel => {
				send({
					command: 'unsubscribe',
					identifier: JSON.stringify({ channel })
				});
			});

			subscribed.current.clear();
		};

		const subscribe = (
			channel: string,
			data?: Record<string, unknown>
		) => {
			if (subscribed.current.has(channel)) return;

			send({
				command: 'subscribe',
				identifier: JSON.stringify({ channel })
			});

			if (data) {
				send({
					command: 'message',
					identifier: JSON.stringify({ channel }),
					data: JSON.stringify(data)
				});
			}
		};
    
    // queueMicrotask tells the browser: "Finish what you're doing, then immediately do this before the next paint."
		queueMicrotask(() => {
			setPrice(null);
			setTrades([]);
			setOhlcv(null);

			unsubscribeAll();

			subscribe('CGSimplePrice', {
				coin_id: [coinId],
				action: 'set_tokens'
			});
		});

		const poolAddress = poolId.replace('_', ':') ?? '';

		if (poolAddress) {
			subscribe('OnchainTrade', {
				'network_id:pool_addresses': [poolAddress],
				action: 'set_pools'
			});

			subscribe('OnchainOHLCV', {
				'network_id:pool_addresses': [poolAddress],
				interval: liveInterval,
				action: 'set_pools'
			});
		}
	}, [coinId, poolId, isWsReady, liveInterval]);

	return {
		price,
		trades,
		ohlcv,
		isConnected: isWsReady
	};
};
