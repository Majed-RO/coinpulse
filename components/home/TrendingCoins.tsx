import { fetcher } from '@/lib/coingecko.actions';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import DataTable from '../DataTable';

const TrendingCoins = async () => {
	const trendingCoins = await fetcher<{ coins: TrendingCoin[] }>(
		'/search/trending',
		undefined,
		300
	);

	const columns: DataTableColumn<TrendingCoin>[] = [
		{
			header: 'Name',
			cellClassName: 'name-cell',
			cell: coin => {
				const item = coin.item;
				return (
					<Link
						href={`/coins/${item.id}`}
						className="flex items-center gap-3"
					>
						<Image
							src={item.large}
							alt={item.name}
							width={36}
							height={36}
							className="rounded-full"
						/>
						<p>{item.name}</p>
					</Link>
				);
			}
		},
		{
			header: 'Price',
			cellClassName: 'price-cell',

			cell: coin => (
				<span>
					$
					{coin.item.data?.price?.toFixed(2) ??
						'N/A'}
				</span>
			)
		},
		{
			header: '24h Change',
			cellClassName: 'name-cell',
			cell: coin => {
				const item = coin.item;

				const changeValue =
					item.data?.price_change_percentage_24h
						?.usd;
				if (
					changeValue === undefined ||
					changeValue === null
				) {
					return <span>N/A</span>;
				}

				const isTrendingUp = changeValue > 0;

				return (
					<div
						className={cn(
							'price-change',
							isTrendingUp
								? 'text-green-500'
								: 'text-red-500'
						)}
					>
						<p className="flex items-center space-x-1">
							<span>
								{formatCurrency(
									changeValue
								)}
							</span>
							{isTrendingUp ? (
								<TrendingUp
									size={
										16
									}
								/>
							) : (
								<TrendingDown
									size={
										16
									}
								/>
							)}
							%
						</p>
					</div>
				);
			}
		},
		{
			header: 'SYMBOL',
			cellClassName: 'price-cell',
			cell: coin => <span>{coin.item.symbol}</span>
		}
	];

	return (
		<div id="trending-coins">
			<h4>Trending Coins</h4>
			<DataTable
				columns={columns}
				data={trendingCoins.coins.slice(0, 5) || []}
				rowKey={coin => coin.item.id}
				tableClassName="trending-coins-table"
				headerCellClassName="py-3!"
				bodyCellClassName="py-2!"
			/>
		</div>
	);
};

export default TrendingCoins;
