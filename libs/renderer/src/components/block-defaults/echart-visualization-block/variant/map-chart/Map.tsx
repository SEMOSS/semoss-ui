import type { ECharts } from "echarts";
import { BarChart } from "echarts/charts";
import {
	GeoComponent,
	LegendComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import EChartsReact from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import type { BlockComponent, ListenerActions } from "../../../../../store";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { processData } from "./MapChartProcessData";
import { formatdatapoints } from "./MapChartTooltipData";
import { getSelector } from "./MapSelector";
import fetchWorldMap from "./map-utility";

echarts.use([
	BarChart,
	TooltipComponent,
	LegendComponent,
	GeoComponent,
	CanvasRenderer,
]);

interface MapDataPoint {
	value: [number, number, ...unknown[]];
}

interface MapContextMenuParams {
	data?: unknown;
	event: {
		event: {
			clientX: number;
			clientY: number;
			preventDefault: () => void;
		};
	};
}

interface MapBlockDef {
	widget: "e-chart";
	data: {
		frame: { name: string };
		aggregate: Record<string, Record<string, string>>;
		option?: Record<string, unknown>;
	};
	listeners: Record<
		string,
		{ order: ListenerActions[]; type: "sync" | "async" }
	>;
	slots: never;
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: component name follows Map chart convention
export const Map: BlockComponent = observer(({ id }) => {
	const { data } = useBlock<MapBlockDef>(id);
	const chartRef = useRef<ECharts | null>(null);
	type SelectorInput = Parameters<typeof getSelector>[0];
	type SelectorAggregates = Parameters<typeof getSelector>[1];
	type ProcessApiData = Parameters<typeof processData>[0];
	type ProcessInput = Parameters<typeof processData>[1];
	type TooltipApiData = Parameters<typeof formatdatapoints>[0];
	type TooltipInput = Parameters<typeof formatdatapoints>[1];

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		value: unknown;
	} | null>(null);

	const frame = useFrame(data?.frame?.name, {
		selector: getSelector(
			data as unknown as SelectorInput,
			(data?.aggregate ?? {}) as SelectorAggregates,
		),
	});

	const baseOption = {
		tooltip: {
			trigger: "item",
		},
		legend: {
			show: true,
		},
		geo: [
			{
				map: "world",
				roam: true,
				zoom: 1,
				center: [0, 0],
			},
		],
		series: [
			{
				type: "scatter",
				coordinateSystem: "geo",
				name: "Markers",
				symbol: "circle",
				data: [],
			},
		],
	};

	useEffect(() => {
		const worldJson = fetchWorldMap("");
		// biome-ignore lint/suspicious/noExplicitAny: echarts.registerMap requires strict GeoJSON type
		echarts.registerMap("world", worldJson as any);
	}, []);

	const processedData = processData(
		frame.data as ProcessApiData,
		data as unknown as ProcessInput,
	);

	useEffect(() => {
		if (!chartRef.current) return;

		const storedOption = (data as unknown as ProcessInput)
			?.option as unknown as Record<string, unknown> | undefined;
		const storedTooltip = storedOption?.tooltip as
			| Record<string, unknown>
			| undefined;
		const storedGeo = (
			storedOption?.geo as Record<string, unknown>[] | undefined
		)?.[0];
		const storedSeries = (
			storedOption?.series as Record<string, unknown>[] | undefined
		)?.[0];

		const fallbackCenter = Array.isArray(storedGeo?.["center"])
			? (storedGeo?.["center"] as [number, number])
			: [0, 0];
		const fallbackZoom =
			typeof storedGeo?.["zoom"] === "number"
				? (storedGeo["zoom"] as number)
				: 1;

		let center = fallbackCenter;
		let zoom = fallbackZoom;
		const mappedData = processedData as MapDataPoint[] | undefined;
		if (mappedData?.length) {
			const lats = mappedData.map((point) => point.value[0]);
			const lons = mappedData.map((point) => point.value[1]);

			const minLat = Math.min(...lats);
			const maxLat = Math.max(...lats);
			const minLon = Math.min(...lons);
			const maxLon = Math.max(...lons);

			center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
			const diff = Math.max(maxLat - minLat, maxLon - minLon);

			zoom = 1;
			if (diff < 1) zoom = 8;
			else if (diff < 5) zoom = 6;
			else if (diff < 10) zoom = 5;
			else if (diff < 20) zoom = 4;
		}

		const storedSeriesName = storedSeries?.["name"];
		const seriesName =
			typeof storedSeriesName === "string" &&
			storedSeriesName.trim().length > 0
				? storedSeriesName
				: "Markers";

		const mergedOption = {
			...(storedOption ?? {}),
			tooltip: {
				...(storedTooltip ?? {}),
				show: (storedTooltip?.["show"] as boolean | undefined) ?? true,
				trigger: "item",
				formatter: formatdatapoints(
					frame.data as TooltipApiData,
					data as unknown as TooltipInput,
				),
			},
			geo: [
				{
					...(storedGeo ?? {}),
					map: "world",
					roam: true,
					center,
					zoom,
				},
			],
			series: [
				{
					...(storedSeries ?? {}),
					type: "scatter",
					coordinateSystem: "geo",
					name: seriesName,
					symbol: "circle",
					data: processedData ?? [],
				},
			],
		};

		chartRef.current.setOption(mergedOption, false);
	}, [processedData, frame.data, data]);

	const onChartReady = (chart: ECharts) => {
		chartRef.current = chart;
		chart.setOption(baseOption);

		chart.on("contextmenu", (rawParams: unknown) => {
			const params = rawParams as MapContextMenuParams;
			if (!params.data) return;
			setContextMenu({
				mouseX: params.event.event.clientX,
				mouseY: params.event.event.clientY,
				value: params.data,
			});
			params.event.event.preventDefault();
		});
	};

	return (
		<div data-block-id={id} className="h-full w-full">
			<EChartsReact
				option={baseOption}
				echarts={echarts}
				onChartReady={onChartReady}
				style={{ height: "100%", width: "100%" }}
			/>

			<VizBlockContextMenu
				id={id}
				frame={frame}
				contextMenu={contextMenu}
				onClose={() => setContextMenu(null)}
			/>
		</div>
	);
});
