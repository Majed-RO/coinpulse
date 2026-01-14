'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

import {
	CommandDialog,
	CommandEmpty,
	CommandInput,
	// CommandItem,
	CommandList
	// CommandShortcut
} from '@/components/ui/command';
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useKey } from '@/hooks/useKey';
import { fetcher, searchCoins } from '@/lib/coingecko.actions';
import DataTable from './DataTable';
import { cn, formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

import useSWR from 'swr';

const CommandDialogModal = () => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');

	// This value only changes 700ms after the user stops typing
	const debouncedQuery = useDebounce(query, 700);

	// 1. First Fetch: Trending Coins
	const { data: trendingData, isLoading: loadingTrending } = useSWR(
		'/search/trending',
		() =>
			fetcher<{
				coins: TrendingCoin[];
			}>('/search/trending', undefined, 300)
	);

	// 2. Second Fetch: Search Results (only if query > 2)
	const { data: searchResults, isLoading: loadingSearch } = useSWR(
		debouncedQuery && debouncedQuery.length > 2
			? debouncedQuery
			: null,
		(query: string) => searchCoins(query)
	);

	// Toggle with Ctrl+K or Cmd+K
	useKey('k', () => setOpen(open => !open), { ctrlOrMeta: true });
	// Close with Escape (no modifiers needed)
	useKey('Escape', () => setOpen(false));

	const columns: DataTableColumn<TrendingCoin>[] = [
		{
			header: 'Name',
			cellClassName: 'name-cell',
			cell: coin => {
				const item = coin.item;
				return (
					<Link
						href={`/coins/${item.id}`}
						onClick={() => setOpen(false)}
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
								{/* {formatCurrency(
									changeValue
								)} */}
								{changeValue.toFixed(
									2
								)}
								%
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
		}
	];

	const searchResultsData: TrendingCoin[] = (searchResults ?? []).map(
		coin => ({
			item: {
				id: coin.id,
				name: coin.name,
				symbol: coin.symbol,
				market_cap_rank: 1,
				thumb: coin.thumb,
				large: coin.image ?? coin.thumb,
				data: {
					price: coin.current_price ?? 0,
					price_change_percentage_24h: {
						usd: coin.price_change_percentage_24h ?? 0
					}
				}
			}
		})
	);

	// Check if Search is "ready" (not loading, exists, and not empty)
	const isSearchReady =
		!loadingSearch && searchResults && searchResults.length > 0;

	return (
		<>
			<p
				className="text-muted-foreground text-sm cursor-default"
				onClick={() => setOpen(!open)}
			>
				Press{' '}
				<kbd className="bg-muted text-muted-foreground  inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
					<span className="text-xs">⌘</span>K
				</kbd>
			</p>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput
					placeholder="Type a command or search..."
					value={query}
					onValueChange={e => setQuery(e)}
				/>
				<CommandList>
					{/* 
						<CommandItem>
							<Calculator />
							<span>Calculator</span>
						</CommandItem> */}

					{/* Show loader only for the active fetch context */}
					{loadingTrending && !isSearchReady && (
						<CommandEmpty>
							<p>Loading...</p>
						</CommandEmpty>
					)}

					{loadingSearch && (
						<CommandEmpty>
							<p>Searching...</p>
						</CommandEmpty>
					)}
					{/* 
          in the the first render show trendingData
          when start searching show searchResultsData
          */}
					{!loadingTrending &&
						trendingData?.coins &&
						debouncedQuery.length < 3 && (
							<DataTable
								columns={
									columns
								}
								data={trendingData?.coins.slice(
									0,
									5
								)}
								rowKey={coin =>
									coin
										.item
										.id
								}
								tableClassName="trending-coins-table"
								headerCellClassName="py-3!"
								bodyCellClassName="py-2!"
								headerClassName="hidden"
							/>
						)}

					{!loadingSearch &&
						debouncedQuery.length > 2 && (
							<DataTable
								columns={
									columns
								}
								data={searchResultsData.slice(
									0,
									5
								)}
								rowKey={coin =>
									coin
										.item
										.id
								}
								tableClassName="trending-coins-table"
								headerCellClassName="py-3!"
								bodyCellClassName="py-2!"
								headerClassName="hidden"
							/>
						)}

					{/* Fallback if everything is finished and still empty */}
					{!loadingSearch &&
						!loadingTrending &&
						debouncedQuery.length > 2 &&
						searchResultsData.length ===
							0 && (
							<CommandEmpty>
								No results
								found.
							</CommandEmpty>
						)}
					{/* </CommandGroup> */}
				</CommandList>
			</CommandDialog>
		</>
	);
};

export default CommandDialogModal;
