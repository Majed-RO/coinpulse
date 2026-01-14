'use server';

import qs from 'query-string';

const BASE_URL =
	process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) {
	throw new Error('Could not get base url');
}

if (!API_KEY) {
	throw new Error('COINGECKO_API_KEY is not defined');
}

export async function fetcher<T>(
	endpoint: string,
	params?: QueryParams,
	revalidate: number = 60
): Promise<T> {
	// Construct the full URL with query parameters
	const url = qs.stringifyUrl(
		{
			url: `${BASE_URL}${endpoint}`,
			query: params
		},
		{ skipEmptyString: true, skipNull: true }
	);

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			'x-cg-demo-api-key': API_KEY
		} as Record<string, string>,
		next: { revalidate }
	});

	if (!response.ok) {
		const errorBody: CoinGeckoErrorBody = await response
			.json()
			.catch(() => {});

		throw new Error(
			`API Error: ${response.status}: ${
				errorBody.error ||
				response.statusText ||
				'No error message'
			}`
		);
	}

	return response.json();
}

export async function getPools(
	id: string,
	network?: string | null,
	contractAddress?: string | null
): Promise<PoolData> {
	const fallback: PoolData = {
		id: '',
		address: '',
		name: '',
		network: ''
	};

	if (network && contractAddress) {
		try {
			const poolData = await fetcher<{ data: PoolData[] }>(
				`/onchain/networks/${network}/tokens/${contractAddress}/pools`
			);

			return poolData.data?.[0] ?? fallback;
		} catch (error) {
			console.log(error);
			return fallback;
		}
	}

	try {
		const poolData = await fetcher<{ data: PoolData[] }>(
			'/onchain/search/pools',
			{ query: id }
		);

		return poolData.data?.[0] ?? fallback;
	} catch {
		return fallback;
	}
}

interface SearchResultCoin {
	id: string;
	name: string;
	symbol: string;
	thumb: string;
}

interface CoinMarketData {
	id: string;
	current_price: number;
	price_change_percentage_24h: number;
	image: string;
	symbol: string;
	name: string;
}

export type MergedCoin = SearchResultCoin & Partial<CoinMarketData>;

export async function searchCoins(query: string): Promise<MergedCoin[]> {
	if (!query) return [];

	try {
		// 1. Fetch search results for the query
		const searchData = await fetcher<{ coins: SearchResultCoin[] }>(
			'/search',
			{ query },
			3600 // Cache search results for 1 hour
		);

		// 2. Extract top 10 IDs
		const top10 = searchData.coins.slice(0, 10);
		const ids = top10.map(coin => coin.id).join(',');

		if (!ids) return [];

		// 3. Fetch detailed market data for those specific IDs
		const marketData = await fetcher<CoinMarketData[]>(
			'/coins/markets',
			{
				vs_currency: 'usd',
				ids: ids,
				order: 'market_cap_desc',
				sparkline: false
			},
			60 // Cache price data for only 60 seconds
		);

		// 4. Merge: Combine the basic search info with the price data
		const mergedResults = top10.map(searchCoin => {
			const details = marketData.find(
				m => m.id === searchCoin.id
			);
			return {
				...searchCoin,
				...details // This adds current_price, price_change, etc.
			};
		});

		return mergedResults;
	} catch (error) {
		console.error('Search failed:', error);
		return [];
	}
}
