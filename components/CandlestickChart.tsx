'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
	getCandlestickConfig,
	getChartConfig,
	LIVE_INTERVAL_BUTTONS,
	PERIOD_BUTTONS,
	PERIOD_CONFIG
} from '@/lib/constants';
import {
	CandlestickSeries,
	createChart,
	IChartApi,
	ISeriesApi
} from 'lightweight-charts';
import { fetcher } from '@/lib/coingecko.actions';
import { convertOHLCData } from '@/lib/utils';

const CandlestickChart = ({
	children,
	data,
	coinId,
	height = 360,
	initialPeriod = 'daily',
	liveOhlcv = null,
	mode = 'historical',
	liveInterval,
	setLiveInterval
}: CandlestickChartProps) => {
	const chartContainerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

	const prevOhlcDataLength = useRef<number>(data?.length || 0);

	const [period, setPeriod] = useState(initialPeriod);
	const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);
	const [isPending, startTransition] = useTransition();

	// console.log('DATA', data);
	// console.log('liveOhlcv', liveOhlcv);

	const fetchOHLCData = async (selectedPeriod: Period) => {
		try {
			const { days, interval } =
				PERIOD_CONFIG[selectedPeriod];

			const newData = await fetcher<OHLCData[]>(
				`/coins/${coinId}/ohlc`,
				{
					vs_currency: 'usd',
					days,
					interval,
					precision: 'full'
				}
			);

			startTransition(() => {
				setOhlcData(newData ?? []);
			});
		} catch (e) {
			console.error('Failed to fetch OHLCData', e);
		}
	};

	const handlePeriodChange = (newPeriod: Period) => {
		if (newPeriod === period) return;

		setPeriod(newPeriod);
		fetchOHLCData(newPeriod);
	};

	const normalizeTimestamp = (t: number) =>
		// if timestamp looks like milliseconds (>= 1e11), convert to seconds
		t > 1e11 ? Math.floor(t / 1000) : Math.floor(t);

	useEffect(() => {
		const container = chartContainerRef.current;
		if (!container) return;

		const showTime = ['daily', 'weekly', 'monthly'].includes(
			period
		);

		const chart = createChart(container, {
			...getChartConfig(height, showTime),
			width: container.clientWidth
		});
		const series = chart.addSeries(
			CandlestickSeries,
			getCandlestickConfig()
		);

		const convertedToSeconds = ohlcData.map(
			item =>
				[
					normalizeTimestamp(item[0]),
					item[1],
					item[2],
					item[3],
					item[4]
				] as OHLCData
		);

		series.setData(convertOHLCData(convertedToSeconds));
		chart.timeScale().fitContent();

		chartRef.current = chart;
		candleSeriesRef.current = series;

		const observer = new ResizeObserver(entries => {
			if (!entries.length) return;
			chart.applyOptions({
				width: entries[0].contentRect.width
			});
		});
		observer.observe(container);

		return () => {
			observer.disconnect();
			chart.remove();
			chartRef.current = null;
			candleSeriesRef.current = null;
		};
	}, [height, period]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const getCleanOHLC = (data: any): any[] => {
		// 1. Safety check: If it's not an array or it's empty, return empty
		if (!Array.isArray(data) || data.length === 0) return [];

		// 2. Logic: If the FIRST element is an array AND that element's FIRST element
		// is ALSO an array, we are too deep.
		// We want to stop when data[0] is the candle [timestamp, open, ...]
		if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
			return getCleanOHLC(data[0]); // Dig deeper
		}

		return data; // This is the final 2D array [[t,o,h,l,c], ...]
	};

	/// useeffect2
	useEffect(() => {
		if (!candleSeriesRef.current) return;

    // TODO I got inconsistent ohlcData, somtimes it will be 3d array, know where is the issue
		const CleanedCandlesData = getCleanOHLC(ohlcData);

		const convertedToSeconds = CleanedCandlesData.map(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(item: any) =>
				[
					normalizeTimestamp(item[0]),
					item[1],
					item[2],
					item[3],
					item[4]
				] as OHLCData
		);

		let merged: OHLCData[];

		if (liveOhlcv) {
			// console.log('liveOhlcv has data:', liveOhlcv);

			const liveTimestamp = liveOhlcv[0];

			const lastHistoricalCandle =
				convertedToSeconds[
					convertedToSeconds.length - 1
				];

			if (
				lastHistoricalCandle &&
				lastHistoricalCandle[0] === liveTimestamp
			) {
				merged = [
					...convertedToSeconds.slice(0, -1),
					liveOhlcv
				];
			} else {
				merged = [...convertedToSeconds, liveOhlcv];
			}
		} else {
			merged = convertedToSeconds;
		}

		merged.sort((a, b) => a[0] - b[0]);

		const converted = convertOHLCData(merged);
		candleSeriesRef.current.setData(converted);

		const dataChanged =
			prevOhlcDataLength.current !==
			CleanedCandlesData.length;

		if (dataChanged || mode === 'historical') {
			chartRef.current?.timeScale().fitContent();
			prevOhlcDataLength.current = CleanedCandlesData.length;
		}
	}, [ohlcData, period, liveOhlcv, mode]);

	// console.log('ohlcData mmmm', ohlcData);
	// console.log('ohlcDataLive mmmm', liveOhlcv);

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
									isPending
								}
							>
								{label}
							</button>
						)
					)}
				</div>

				{liveInterval && (
					<div className="button-group">
						<span className="text-sm mx-2 font-medium text-purple-100/50">
							Update Frequency:
						</span>
						{LIVE_INTERVAL_BUTTONS.map(
							({
								value,
								label
							}: {
								value: Interval;
								label: string;
							}) => (
								<button
									key={
										value
									}
									className={
										liveInterval ===
										value
											? 'config-button-active'
											: 'config-button'
									}
									onClick={() =>
										setLiveInterval &&
										setLiveInterval(
											value
										)
									}
									disabled={
										isPending
									}
								>
									{label}
								</button>
							)
						)}
					</div>
				)}
			</div>

			<div
				ref={chartContainerRef}
				className="chart"
				style={{ height }}
			/>
		</div>
	);
};

export default CandlestickChart;
