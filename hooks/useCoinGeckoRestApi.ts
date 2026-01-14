'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type RawTrade = {
	id: string;
	attributes: {
		price_from_in_usd: string;
		kind: string;
		block_timestamp: string;
		volume_in_usd: string;
		converted_volume: string;
	};
};

const INTERVAL_CONFIG: Record<
	string,
	{ timeframe: string; aggregate: number }
> = {
	'1s': { timeframe: 'second', aggregate: 1 },
	'1m': { timeframe: 'minute', aggregate: 1 }
};

const NETWORK_MAP: Record<string, string> = {
	ethereum: 'eth',
	'binance-smart-chain': 'bsc',
	'polygon-pos': 'polygon_pos',
	base: 'base',
	'arbitrum-one': 'arbitrum'
};

export const useCoinGeckoPolling = ({
	coinId,
	interval
}: {
	coinId: string;
	interval: Interval;
}) => {
	const [price, setPrice] = useState<ExtendedPriceData | null>(null);
	const [trades, setTrades] = useState<Trade[]>([]);
	const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);

	const [loading, setLoading] = useState(true);
	const [isConnected, setIsConnected] = useState(false);

	// Use a ref to track the current request to prevent race conditions
	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchCG = useCallback(
		async (path: string, params: string = '') => {
			const API_KEY =
				process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
			const url = `https://api.coingecko.com/api/v3${path}?${params}&x_cg_demo_api_key=${API_KEY}`;

			const res = await fetch(url, {
				signal: abortControllerRef.current?.signal
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		},
		[]
	);

	const fetchData = useCallback(async () => {
		// console.log('WE ARE IN useCoinGeckoRestApi');

		// Cancel any ongoing requests before starting a new poll
		if (abortControllerRef.current)
			abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();

		try {
			const coinData = await fetchCG(
				`/coins/${coinId}`,
				'localization=false&tickers=true'
			);

			setPrice({
				usd: coinData.market_data.current_price.usd,
				change24h: coinData.market_data
					.price_change_percentage_24h,
				marketCap: coinData.market_data.market_cap.usd,
				volume24h: coinData.market_data.total_volume.usd
			});

			const platforms = coinData.platforms || {};
			const platformKeys = Object.keys(platforms).filter(
				k => k !== ''
			);

			if (platformKeys.length > 0) {
				const platform = platformKeys[0];
				const network =
					NETWORK_MAP[platform] || platform;
				const address = platforms[platform];

				const poolsRes = await fetchCG(
					`/onchain/networks/${network}/tokens/${address}/pools`
				);
				const pool = poolsRes.data?.[0];

				if (pool?.attributes?.address) {
					const poolAddress =
						pool.attributes.address;
					const config =
						INTERVAL_CONFIG[interval] ||
						INTERVAL_CONFIG['1m'];

					const [tradeRes, ohlcvRes] =
						await Promise.all([
							fetchCG(
								`/onchain/networks/${network}/pools/${poolAddress}/trades`
							),
							fetchCG(
								`/onchain/networks/${network}/pools/${poolAddress}/ohlcv/${config.timeframe}`,
								`aggregate=${config.aggregate}`
							)
						]);

					setTrades(
						(tradeRes.data || [])
							.slice(0, 10)
							.map((t: RawTrade) => ({
								id: t.id,
								price: parseFloat(
									t
										.attributes
										.price_from_in_usd
								),
								type:
									t
										.attributes
										.kind ===
									'buy'
										? 'b'
										: 's',
								timestamp: new Date(
									t.attributes.block_timestamp
								).getTime(),
								amount: t
									.attributes
									.volume_in_usd,
								value: t
									.attributes
									.converted_volume
							}))
					);

					// On-chain OHLCV list is usually under attributes.ohlcv_list
					setOhlcv(
						ohlcvRes.data.attributes
							.ohlcv_list[0]
					);
				}
			} else {
				// NATIVE FALLBACK: Use standard OHLC endpoint instead of mocking from market_chart
				const ohlcData = await fetchCG(
					`/coins/${coinId}/ohlc`,
					'vs_currency=usd&days=1'
				);

				/* const ohlcData2 = await fetcher<OHLCData[]>(
                `/coins/${coinId}/ohlc`,
                {
                  vs_currency: 'usd',
                  days: 1,
                  interval : 'hourly',
                  precision: 'full'
                }
              ); */

				if (ohlcData && Array.isArray(ohlcData)) {
					// Set only the latest candle (last element) for live OHLCV display
					setOhlcv(
						ohlcData[
							ohlcData.length - 1
						] as OHLCData
					);
				}

				setTrades(
					(coinData.tickers || [])
						.slice(0, 10)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.map((t: any, i: number) => ({
							id: `cex-${i}`,
							price: t.converted_last
								.usd,
							type: 'b',
							timestamp: new Date(
								t.timestamp
							).getTime(),
							amount: t.volume,
							value: t
								.converted_volume
								.usd
						}))
				);
			}

			setIsConnected(true);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			if (err.name !== 'AbortError') {
				console.error('Polling Error:', err);
				setIsConnected(false);
			}
		} finally {
			setLoading(false);
		}
	}, [coinId, interval, fetchCG]);

	useEffect(() => {
		setLoading(true);
		fetchData();
		const id = setInterval(fetchData, 45000); // Increased to 45s to stay safe with Demo rate limits
		return () => {
			clearInterval(id);
			abortControllerRef.current?.abort();
		};
	}, [fetchData]);

	return {
		price,
		trades,
		ohlcv,
		loading,
		isConnected,
		refetch: fetchData
	};
};
