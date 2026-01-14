'use client';

import { fetcher } from '@/lib/coingecko.actions';
import {
	getCandlestickConfig,
	getChartConfig,
	PERIOD_BUTTONS,
	PERIOD_CONFIG
} from '@/lib/constants';
import { convertOHLCData } from '@/lib/utils';
import {
	CandlestickSeries,
	createChart,
	IChartApi,
	ISeriesApi
} from 'lightweight-charts';
import { useEffect, useRef, useState, useTransition } from 'react';

const CandlestickChart = ({
	children,
	data,
	coinId,
	height = 360,
	initialPeriod = 'daily'
}: CandlestickChartProps) => {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi>(null);
	const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(
		null
	); // // "I am making a Series, and specifically, it's the Candlestick version."

	const [loading, setLoading] = useState(false);
	const [period, setPeriod] = useState(initialPeriod);
	// The ?? operator triggers the fallback only for nullish values (null or undefined). It treats 0, false, and "" as valid data and will keep them.
	const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);

	const [transition, startTransition] = useTransition();

	const fetchOHLCData = async (selectedPeriod: Period) => {
		setLoading(true);
		try {
			const { days, interval } =
				PERIOD_CONFIG[selectedPeriod];

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const params: Record<string, any> = {
				vs_currency: 'usd',
				days,
				precision: 'full'
			};

			if (interval) {
				params.interval = interval;
			}

			const newData = await fetcher<OHLCData[]>(
				`/coins/${coinId}/ohlc`,
				params
			);
			setOhlcData(newData ?? []);
			setLoading(false);
			// return newData;
		} catch (error) {
			console.log('Failed to fetch OHLCData', error);
			setLoading(false);
		}
	};

	const handlePeriodChange = (newPeriod: Period) => {
		// Implement period change logic here
		if (newPeriod === period) return;

		startTransition(async () => {
			setPeriod(newPeriod);
			await fetchOHLCData(newPeriod);
		});
	};

	useEffect(() => {
		const container = chartContainerRef.current;
		if (!container) return;

		const showTime = ['daily', 'weekly', 'monthly'].includes(
			period
		);

		// Create chart
		const chart = createChart(container, {
			...getChartConfig(height, showTime),
			width: container.clientWidth
		});

		const series = chart.addSeries(
			CandlestickSeries,
			getCandlestickConfig()
		);

		series.setData(convertOHLCData(ohlcData));
		chart.timeScale().fitContent();

		chartRef.current = chart;
		candlestickSeriesRef.current = series;

		const observer = new ResizeObserver(entries => {
			if (!entries || entries.length === 0) return;

			chart.applyOptions({
				width: entries[0].contentRect.width
			});
		});

		observer.observe(container);

		return () => {
			chart.remove();
			observer.disconnect();
			chartRef.current = null;
			candlestickSeriesRef.current = null;
		};
	}, [height, period, ohlcData]);

	useEffect(() => {
		if (!candlestickSeriesRef.current) return;

		const convertedToSeconds = ohlcData.map(
			d =>
				[
					Math.floor(d[0] / 1000),
					d[1],
					d[2],
					d[3],
					d[4]
				] as OHLCData
		);

		const converted = convertOHLCData(convertedToSeconds);

		candlestickSeriesRef.current.setData(converted);
		if (chartRef.current) {
			chartRef.current.timeScale().fitContent();
		}
	}, [ohlcData, period]);

	return (
		<div id="candlestick-chart">
			<div className="chart-header">
				<div className="flex-1">{children}</div>

				<div className="button-group">
					<span className="text-sm mx-2 font-medium text-purple-100/50">
						Period:
					</span>
					{PERIOD_BUTTONS.map(
						({ value, label }) => (
							<button
								key={value}
								className={
									period ===
									value
										? 'config-button-active'
										: 'config-button'
								}
								onClick={() =>
									handlePeriodChange(
										value
									)
								}
								disabled={
									loading
								}
							>
								{label}
							</button>
						)
					)}
				</div>
			</div>
			{/* chart */}
			<div
				ref={chartContainerRef}
				className="chart"
				style={{ height: height }}
			></div>
		</div>
	);
};

export default CandlestickChart;
