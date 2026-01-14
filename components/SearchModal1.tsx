'use client';

import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import Image from 'next/image';
import Link from 'next/link';
import { fetcher } from '@/lib/coingecko.actions';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useKey } from '@/hooks/useKey';
import { useDebounce } from '@/hooks/useDebounce';

const CommandModal = ({
	isOpen,
	setIsOpen
}: {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const [data, setData] = useState<TrendingCoin[]>([]);
	const [loading, setLoading] = useState(false);

	const [query, setQuery] = useState('');

	// This value only changes 300ms after the user stops typing
	const debouncedQuery = useDebounce(query, 300);

	// Toggle with Ctrl+K or Cmd+K
	useKey('k', () => setIsOpen(prev => !prev), { ctrlOrMeta: true });

	// Close with Escape (no modifiers needed)
	useKey('Escape', () => setIsOpen(false));

	useEffect(() => {
		const getTrending = async () => {
			try {
				setLoading(true);
				// Using your fetcher function
				const response = await fetcher<{
					coins: TrendingCoin[];
				}>('/search/trending', undefined, 300);
				setData(response.coins);
			} catch (error) {
				console.error('Failed to fetch:', error);
			} finally {
				setLoading(false);
			}
		};

		getTrending();
	}, []);

	useEffect(() => {
		if (debouncedQuery) {
			console.log('Fetching results for:', debouncedQuery);
			// Perform your fetcher call here using debouncedQuery
		}
	}, [debouncedQuery]);

	if (!isOpen) return null;

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
						<div className="flex flex-col">
							<p>{item.name}</p>
							<span>
								{item.symbol}
							</span>
						</div>
					</Link>
				);
			}
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
		}
	];

	return (
		<div
			// 1. The Backdrop (Overlay)
			className="fixed inset-0 z-50 flex items-start justify-center bg-black/10 pt-[15vh] backdrop-blur-xs"
			onClick={() => setIsOpen(false)} // 2. Close when backdrop is clicked
		>
			<div
				// 3. The Modal Content (Stopping Propagation)
				onClick={e => e.stopPropagation()} // 4. Prevents closing when clicking INSIDE
				className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 border dark:border-gray-800"
			>
				<div className="p-4">
					<input
						autoFocus
						value={query}
						onChange={e =>
							setQuery(e.target.value)
						}
						type="text"
						placeholder="Type coin name"
						className="w-full bg-transparent text-lg outline-none"
					/>
				</div>

				{loading ? (
					<p>Loading...</p>
				) : (
					<DataTable
						columns={columns}
						data={data.slice(0, 5) || []}
						rowKey={coin => coin.item.id}
						tableClassName="trending-coins-table"
						headerCellClassName="py-3!"
						bodyCellClassName="py-2!"
						headerClassName="hidden"
					/>
				)}

				<div className="border-t p-2 text-xs text-gray-500 flex justify-between dark:border-gray-800">
					{/* <span>Search documentation...</span> */}
					<span>ESC to close</span>
				</div>
			</div>
		</div>
	);
};

export default CommandModal;
