import CoinOverview from '@/components/home/CoinOverview';
import TrendingCoins from '@/components/home/TrendingCoins';
import { Suspense } from 'react';
import {
	CoinOverviewFallback,
	TrendingCoinsFallback,
	CategoriesFallback
} from '@/components/fallback';
import Categories from '@/components/home/Categories';

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
				<Suspense fallback={<CategoriesFallback />}>
					<Categories />
				</Suspense>
			</section>
		</main>
	);
};

export default Home;
