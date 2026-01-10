import DataTable from '@/components/DataTable';

export const CoinOverviewFallback = () => {
	return (
		<div id="coin-overview-fallback">
			<div className="header">
				<div className="header-image skeleton" />
				<div className="info">
					<div className="header-line-lg skeleton" />
					<div className="header-line-sm skeleton" />
				</div>
			</div>

			<div className="flex gap-2 mb-4">
				<div className="period-button-skeleton skeleton" />
				<div className="period-button-skeleton skeleton" />
				<div className="period-button-skeleton skeleton" />
			</div>

			<div className="chart">
				<div className="chart-skeleton skeleton" />
			</div>
		</div>
	);
};

export const TrendingCoinsFallback = () => {
	const columns = [
		{
			header: 'Name',
			cellClassName: 'name-cell',
			cell: () => (
				<div className="name-link">
					<div className="name-image skeleton" />
					<div>
						<div className="name-line skeleton" />
					</div>
				</div>
			)
		},
		{
			header: 'Price',
			cellClassName: 'price-cell',
			cell: () => <div className="price-line skeleton" />
		},
		{
			header: '24h Change',
			cellClassName: 'change-cell',
			cell: () => <div className="change-line skeleton" />
		},
		{
			header: 'SYMBOL',
			cellClassName: 'price-cell',
			cell: () => <div className="name-line skeleton" />
		}
	];

	// placeholder rows to match table layout
	const rows = new Array(4)
		.fill(null)
		.map((_, i) => ({ id: `skeleton-${i}` }));

	return (
		<div id="trending-coins-fallback">
			<h4>Trending Coins</h4>
			<DataTable
				columns={columns}
				data={rows}
				rowKey={(r, i) => r.id ?? i}
				tableClassName="trending-coins-table"
			/>
		</div>
	);
};


