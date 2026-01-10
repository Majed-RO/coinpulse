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
