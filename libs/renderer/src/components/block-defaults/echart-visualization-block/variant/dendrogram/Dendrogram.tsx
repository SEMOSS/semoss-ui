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

interface DendrogramNode {
	name: string;
	value?: unknown;
	category?: string;
	selector?: string;
	children: DendrogramNode[];
	childrenIndex: number;
	itemStyle: { color: string };
}

interface DendrogramContextMenuParams {
	data?: {
		name: string;
		value?: unknown;
		selector?: string;
	};
	event: {
		event: {
			clientX: number;
			clientY: number;
			preventDefault: () => void;
		};
	};
	seriesIndex: number;
}

//bar component properties
interface DendrogramProps {
	id: string;
	updateJson: (data: unknown, path: string) => void;
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
		valueToCheck = Number.isNaN(
			parseInt(valueToCheck?.toString() ?? "", 10),
		)
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

		const builtSelector = `Select(${data.columns
			?.map((c, _index) => {
				//Converting Y axis columns to Average by default
				return c.selector;
			})
			.join(", ")}).as([${data.columns
			?.map((c, _index) => {
				return c.name;
			})
			.join(", ")}])`;
		return builtSelector;
	}, [data.columns, data.facet.facetSelected, facetFrame.data.values]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	useEffect(() => {
		if (
			facetFrame.isLoading === false &&
			facetFrame.data.values.length > 0
		) {
			setData(
				"facet.facetList",
				facetFrame.data.values.map((item: unknown[]) =>
					String(item[0]),
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

	function getSelectorData(header: string): string {
		const headerDataList =
			data.columns.find((item) => item.name === header)?.selector || "";
		return headerDataList;
	}
	function getColorData(currentIndex: number): string {
		const colorList = parsedJson?.color || [];
		return colorList[currentIndex % colorList.length] || "#b0c4de";
	}

	// Build dendrogram option - computed in render like Bar/Line charts
	const buildDendrogramOption = () => {
		let option = JSON.parse(computedValue);

		const seriesIndex = option.series.findIndex(
			(item: { type: string; data: unknown[] }) =>
				item.type === "tree" && item.data.length,
		);
		const dataColumns =
			data.columns?.find((item) => Object.hasOwn(item, "isFacet")) || {};
		if (seriesIndex > -1) {
			// Build hierarchical tree structure by grouping data
			const root: DendrogramNode = {
				name: "Root",
				children: [],
				childrenIndex: 0,
				itemStyle: { color: getColorData(0) },
			};

			// Helper function to find or create a child node
			const findOrCreateChild = (
				parent: DendrogramNode,
				category: string,
				value: unknown,
				depth: number,
			): DendrogramNode => {
				let child = parent.children.find((c) => c.value === value);
				if (!child) {
					child = {
						name: category,
						value: value,
						category: category,
						selector: getSelectorData(category),
						children: [],
						childrenIndex: depth,
						itemStyle: {
							color: getColorData(depth),
						},
					};
					parent.children.push(child);
				}
				return child;
			};

			// Build the tree hierarchically
			for (let i = 0; i < frame.data.values.length; i++) {
				let currentParent: DendrogramNode = root;

				for (let j = 0; j < frame.data.values[i].length; j++) {
					// Skip facet column if present
					if (
						Object.hasOwn(dataColumns, "name") &&
						j + 1 === frame.data.values[i].length
					)
						continue;

					currentParent = findOrCreateChild(
						currentParent,
						frame.data.headers[j],
						frame.data.values[i][j],
						j + 1,
					);
				}
			}

			option.series[seriesIndex].data = [root];
			option.series[seriesIndex] = {
				...option.series[seriesIndex],
				label: {
					...option.series[seriesIndex].label,
					formatter: (params: {
						data: { name: string; value?: unknown };
						seriesIndex: number;
					}) => {
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
			// Remove existing legend series to avoid duplicates
			option.series = option.series.filter(
				(s: { type: string; data: unknown[] }) =>
					s.type === "tree" && s.data.length > 0,
			);
			// Add legend series
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
	};

	// Compute option in render
	const dataOption =
		data.frame.name &&
		frame.data.values.length > 0 &&
		frame.isLoading === false
			? buildDendrogramOption()
			: parsedJson;

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency list
	useEffect(() => {
		if (frame.isLoading === false && frame.data.values.length > 0) {
			updateJson(dataOption, "option");
		}
	}, [frame.data.values]);

	//on events object for getting and processing events with chart
	const onClickChart = {
		//when contextmenu event is raised, default context menu made hidden, and custom component is shown
		contextmenu: (rawParams: unknown) => {
			const params = rawParams as DendrogramContextMenuParams;
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
				key={JSON.stringify(dataOption)}
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
