import React from 'react';
import DataTable from '../DataTable';
import { fetcher } from '@/lib/coingecko.actions';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

const Categories = async () => {
	const categories = await fetcher<Category[]>('/coins/categories');

	const columns: DataTableColumn<Category>[] = [
		{
			header: 'Category',
			cellClassName: 'Category-cell',
			cell: category => category.name
		},
		{
			header: 'Top Gainers',
			cellClassName: 'top-gainers-cell',
			cell: category =>
				Array.isArray(category.top_3_coins) &&
				category.top_3_coins.length > 0
					? category.top_3_coins.map(coin => (
							<Image
								src={coin}
								alt={coin}
								key={coin}
								width={28}
								height={28}
							/>
					  ))
					: null
		},
		{
			header: '24h Change',
			cellClassName: 'change-header-cell',

			cell: category => {
				const changeValue =
					category.market_cap_change_24h;
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
							'change-cell',
							isTrendingUp
								? 'text-green-500'
								: 'text-red-500'
						)}
					>
						<p className="flex items-center space-x-1">
							<span>
								{formatPercentage(
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
						</p>
					</div>
				);
			}
		},

		{
			header: 'Market Cap',
			cellClassName: 'market-cap-cell',
			cell: category => formatCurrency(category.market_cap)
		},
		{
			header: '24h Volume',
			cellClassName: 'volume-cell',
			cell: category => formatCurrency(category.volume_24h)
		}
	];

	return (
		<div id="categories" className="custom-scrollbar">
			<h4>Top Category</h4>

			<DataTable
				columns={columns}
				data={categories?.slice(0, 10)}
				rowKey={(_, index) => index}
				tableClassName="mt-3"
			/>
		</div>
	);
};

export default Categories;
