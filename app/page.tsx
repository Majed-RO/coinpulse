import CoinOverview from '@/components/home/CoinOverview';
import TrendingCoins from '@/components/home/TrendingCoins';
import { Suspense } from 'react';
import {
	CoinOverviewFallback,
	TrendingCoinsFallback
} from '@/components/fallback';

const Home = async () => {
	return (
		<main className="main-container">
			<section className="home-grid">
				{/* coin overflow */}
				<Suspense fallback={<CoinOverviewFallback />}>
					<CoinOverview />
				</Suspense>

				{/* trending coins */}
				<Suspense fallback={<TrendingCoinsFallback />}>
					<TrendingCoins />
				</Suspense>
			</section>

			<section className="w-full mt-7 space-y-4">
				<p>Categories</p>
			</section>
		</main>
	);
};

export default Home;
