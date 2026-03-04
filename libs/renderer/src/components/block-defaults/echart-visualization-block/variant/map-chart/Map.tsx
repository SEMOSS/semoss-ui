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
import { styled } from "@semoss/ui";
import { useBlock, useFrame } from "../../../../../hooks";
import type { BlockComponent } from "../../../../../store";
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

const StyledNoDataContainer = styled("div")({
	height: "100%",
	width: "100%",
});

export const Map: BlockComponent = observer(({ id }) => {
	const { data } = useBlock<any>(id);
	const chartRef = useRef<any>(null);

	const [contextMenu, setContextMenu] = useState<any>(null);

	const frame = useFrame(data?.frame?.name, {
		selector: getSelector(data, data?.aggregate),
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
				symbol: "circle",
				data: [],
			},
		],
	};
	
	useEffect(() => {
		const worldJson = fetchWorldMap("");
		echarts.registerMap("world", worldJson);
	}, []);

	const processedData = processData(frame.data, data);

	useEffect(() => {
		if (!chartRef.current || !processedData?.length) return;

		const lats = processedData.map((d: any) => d.value[0]);
		const lons = processedData.map((d: any) => d.value[1]);

		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);
		const minLon = Math.min(...lons);
		const maxLon = Math.max(...lons);

		const center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
		const diff = Math.max(maxLat - minLat, maxLon - minLon);

		let zoom = 1;
		if (diff < 1) zoom = 8;
		else if (diff < 5) zoom = 6;
		else if (diff < 10) zoom = 5;
		else if (diff < 20) zoom = 4;

		chartRef.current.setOption(
			{
				tooltip: {
					formatter: formatdatapoints(frame.data, data),
				},
				geo: [
					{
						center,
						zoom,
					},
				],
				series: [
					{
						data: processedData,
					},
				],
			},
			false,
		);
	}, [processedData, frame.data]);

	const onChartReady = (chart: any) => {
		chartRef.current = chart;
		chart.setOption(baseOption);

		chart.on("contextmenu", (params: any) => {
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
		<StyledNoDataContainer data-block-id={id}>
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
		</StyledNoDataContainer>
	);
});
