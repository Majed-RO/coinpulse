/* eslint-disable react-hooks/error-boundaries */
import { fetcher } from '@/lib/coingecko.actions';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import CandlestickChart from '../CandlestickChart';
import { CoinOverviewFallback } from '../fallback';

const CoinOverview = async () => {
	try {
		const [coin, coinOHLCdData] = await Promise.all([
			fetcher<CoinDetailsData>('/coins/bitcoin', {
				dex_pair_format: 'symbol' // will return the short name of the coin as btc
			}),
			fetcher<OHLCData[]>('/coins/bitcoin/ohlc', {
				vs_currency: 'usd',
				days: 1,
				// interval: 'hourly',
				precision: 'full'
			})
		]);

		return (
			<div id="coin-overview">
				<CandlestickChart data={coinOHLCdData} coinId={coin.id}>
					<div className="header pt-2">
						<Image
							src={coin.image.large}
							alt={coin.name}
							width={56}
							height={56}
						/>

						<div className="info">
							<p>
								{coin.name} /{' '}
								{coin.symbol.toUpperCase()}
							</p>
							<h1>
								{formatCurrency(
									coin
										.market_data
										.current_price
										.usd
								)}
							</h1>
						</div>
					</div>
				</CandlestickChart>
			</div>
		);
	} catch (error) {
		console.error('Error fetching coin data:', error);
		return <CoinOverviewFallback />;
	}
};

export default CoinOverview;
