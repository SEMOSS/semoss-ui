import type { EChartsOption } from "echarts";
import EChartsReact from "echarts-for-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useBlock, useFrame } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { DendrogramChartField } from "./DendrogramChartField";

//bar component properties
interface DendrogramProps {
	id: string;
	// biome-ignore lint/suspicious/noExplicitAny: echart data/path types are untyped
	updateJson: (data: any, path: any) => void;
}

export const Dendrogram = observer(({ id, updateJson }: DendrogramProps) => {
	const { data, setData } = useBlock<EchartVisualizationBlockDef>(id);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number; //x axis position for the click/brush event
		mouseY: number; //y axis position for the click/brush event
		value: unknown; //value can be of object or string or number type
	} | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	const computedValue = useMemo(() => {
		return computed(() => {
			if (!data) {
				return "";
			}
			const v = getValueByPath(data, "option");
			if (typeof v === "undefined") {
				return "";
			} else if (typeof v === "string") {
				return v;
			}
			return JSON.stringify(v, null, 2);
		});
	}, [data, "option"]).get();
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	const _facetcomputedValue = useMemo(() => {
		return computed(() => {
			if (!data) {
				return "";
			}
			const v = getValueByPath(data, "facet.facetList");
			if (typeof v === "undefined") {
				return "";
			} else if (typeof v === "string") {
				return v;
			}
			return JSON.stringify(v, null, 2);
		});
	}, [data, "facet.facetList"]).get();

	const parsedJson = useMemo(() => {
		try {
			return JSON.parse(computedValue);
		} catch (_e) {
			return null;
		}
	}, [computedValue]);
	//Select (bp_1d) | Sort(columns=["bp_1d"], sort=["asc"]) | Collect(-1)
	const facetSelector = useMemo(() => {
		return `Select (${data.facet?.facetSelected?.map((c, _index) => {
			return c.selector;
		})}).as([${data.facet?.facetSelected?.map((c, _index) => {
			return c.name;
		})}]) | Sort(columns=["${data.facet?.facetSelected?.map(
			(c) => c.name,
		)}"], sort=["asc"]) `;
	}, [data.facet.facetSelected]);

	const facetFrame = useFrame(data.frame.name, {
		selector: facetSelector,
	});
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	const facetAndDimensionSelector = useMemo(() => {
		let valueToCheck =
			data.facet?.facetSelected?.[0]?.value === 0
				? facetFrame.data.values[0]?.[0]
				: data.facet?.facetSelected?.[0]?.value;
		valueToCheck = Number.isNaN(parseInt(valueToCheck?.toString(), 10))
			? `"${valueToCheck}"`
			: valueToCheck;
		return `Select(${data.columns
			?.map((c, _index) => {
				//Converting Y axis columns to Average by default
				return c.selector;
			})
			.join(", ")}).as([${data.columns
			?.map((c, _index) => {
				return c.name;
			})
			.join(", ")}]) | Filter(${
			data.facet?.facetSelected?.[0]?.name
		} == ${valueToCheck})`;
	}, [data.facet.facetSelected, facetFrame.data.values]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	const selector = useMemo(() => {
		if (
			data.facet?.facetSelected?.length &&
			data.facet?.facetSelected?.[0]?.selector !== ""
		) {
			return facetAndDimensionSelector;
		}
		return `Select(${data.columns
			?.map((c, _index) => {
				//Converting Y axis columns to Average by default
				return c.selector;
			})
			.join(", ")}).as([${data.columns
			?.map((c, _index) => {
				return c.name;
			})
			.join(", ")}])`;
	}, [data.columns, data.facet.facetSelected, facetFrame.data.values]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	useEffect(() => {
		if (
			facetFrame.isLoading === false &&
			facetFrame.data.values.length > 0
		) {
			setData(
				"facet.facetList",
				facetFrame.data.values.map((item: string[] | number[]) =>
					item[0].toString(),
				),
			);
			setData("facet.facetSelected", [
				{
					name: data.facet.facetSelected[0].name,
					selector: data.facet.facetSelected[0].selector,
					value: facetFrame.data.values?.[0]?.[0]?.toString(),
				},
			]);
		}
	}, [facetFrame.data.values]);

	const frame = useFrame(data.frame.name, {
		selector: selector,
	});
	function getSelectorData(header) {
		const headerDataList =
			data.columns.find((item) => item.name === header)?.selector || "";
		return headerDataList;
	}
	function getColorData(currentIndex) {
		const colorList = parsedJson?.color || [];
		return colorList[currentIndex % colorList.length] || "#b0c4de";
	}
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	const dataOption = useMemo(() => {
		let option = JSON.parse(computedValue);

		const seriesIndex = option.series.findIndex(
			(item) => item.type === "tree" && item.data.length,
		);
		const dataColumns =
			data.columns?.find((item) => Object.hasOwn(item, "isFacet")) || {};
		if (seriesIndex > -1) {
			const _data = option.series[seriesIndex].data;
			// let updatedDataListres = getDataValuesUpdate(0,frame.data.headers.length, [{name: 'Root', children: [], childrenIndex: 0, itemStyle: {color: getColorData(0)}}], -1);
			const updatedDataListresLoop = [
				{
					name: "Root",
					children: [],
					childrenIndex: 0,
					itemStyle: { color: getColorData(0) },
				},
			];
			for (let i = 0; i < frame.data.values.length; i++) {
				let currentParent = updatedDataListresLoop[0]; // Start from Root for each row
				for (let j = 0; j < frame.data.values[i].length; j++) {
					if (
						Object.hasOwn(dataColumns, "name") &&
						j + 1 === frame.data.values[i].length
					)
						continue;
					const childNode = {
						name: frame.data.headers[j],
						value: frame.data.values[i][j],
						category: frame.data.headers[j],
						selector: getSelectorData(frame.data.headers[j]),
						children: [],
						childrenIndex: j + 1,
						itemStyle: {
							color: getColorData(j + 1),
						},
					};
					currentParent.children.push(childNode);
					currentParent = childNode; // Move deeper for the next child
				}
			}
			option.series[seriesIndex].data = updatedDataListresLoop;
			option.series[seriesIndex] = {
				...option.series[seriesIndex],
				label: {
					...option.series[seriesIndex].label,
					formatter: (params) => {
						if (
							params.data.name === "Root" &&
							params.seriesIndex === 0
						) {
							return "";
						}
						return params.data.value;
					},
				},
			};
		}
		const legendData = ["Root", ...frame.data.headers];
		if (option.legend?.show) {
			const legendSeries = legendData.map((item, _index) => {
				return {
					name: item,
					type: "tree",
					data: [],
				};
			});
			option.series = [...option.series, ...legendSeries];
		}
		option = {
			...option,
			legend: {
				...option.legend,
				orient: "horizontal",
				left: "center",
				data: ["Root", ...frame.data.headers].map((item, index) => {
					return {
						name: item,
						icon: Object.hasOwn(
							option.series[seriesIndex],
							"symbol",
						)
							? option.series[seriesIndex].symbol
							: "circle",
						itemStyle: {
							color: getColorData(index),
						},
					};
				}),
			},
		};
		return option;
	}, [frame.data.values, computedValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	useEffect(() => {
		if (frame.isLoading === false && frame.data.values.length > 0) {
			updateJson(dataOption, "option");
		}
	}, [frame.data.values]);

	//on events object for getting and processing events with chart
	const onClickChart = {
		//when contextmenu event is raised, default context menu made hidden, and custom component is shown
		contextmenu: (params) => {
			if (params.data) {
				const selector = params.data.selector;
				const value = params.data.value;
				setContextMenu(
					contextMenu === null
						? {
								mouseX: params.event.event.clientX,
								mouseY: params.event.event.clientY,
								value: {
									label: selector,
									value: value,
								},
							}
						: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
							// Other native context menus might behave different.
							// With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
							null,
				);
				params.event.event.preventDefault();
			} else {
				params.event.event.preventDefault();
			}
		},
	};
	const showDendrogramChartField = !!data.facet.facetSelected.length;
	return (
		<div id={id} className="h-full w-full">
			<EChartsReact
				option={dataOption as EChartsOption}
				// onChartReady={echartsLoaded}
				onEvents={onClickChart}
				showLoading={frame.isLoading || facetFrame.isLoading}
				style={{
					height: showDendrogramChartField ? "87%" : "100%",
					width: "100%",
				}}
			/>
			<div className="flex h-[12%] max-h-[12%] w-full justify-start overflow-auto">
				{showDendrogramChartField && (
					<DendrogramChartField
						id={id}
						facetListData={facetFrame.data.values}
					/>
				)}
			</div>
			<VizBlockContextMenu
				id={id}
				frame={frame}
				contextMenu={contextMenu}
				onClose={() => {
					setContextMenu(null);
				}}
			/>
		</div>
	);
});
