import { useEffect, useState } from "react";
import type {
	BlockComponent,
	EchartVisualizationBlockDef,
} from "@semoss/renderer";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { JsonSettings } from "../../shared";
import { VisualMap } from "./VisualMap";
import { UpgradedVisualizationTool } from "./variant/bar-chart/UpgradedVisualizationTool";
import {
	Bar,
	Cloud,
	Dendrogram,
	Gantt,
	Line,
	Pie,
	ScatterPlot,
	StackChart,
	WorldMap,
} from "./variant/Constant";
import { FrameOperations } from "./variant/FrameOperations";
import type {
	StoredColumn,
	VisualMapItem,
} from "./variant/shared/shared-interfaces";

export const VisualizationBlockMenu: BlockComponent = ({ id }) => {
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
	const [selectedTab, setSelectedTab] = useState("Data");
	const [selectedColumn, setSelectedColumn] = useState<StoredColumn[]>([]);
	const [_forceRender, setForceRender] = useState(false);
	function updateFrame() {}

	// echart event type
	function handleStoreData(storeData: StoredColumn[]) {
		const hasValues = storeData.some(
			(item) => item?.values && item?.values.length > 0,
		);
		if (hasValues) {
			setSelectedColumn(storeData);
		}
	}

	// echart event type
	const handleSelectedItem = (item: VisualMapItem) => {
		if (item.title && item.option) {
			setData("variation", item.title);
			setData("option", item.option);
			if (item?.facet) {
				setData("facet", item.facet);
			}
			setForceRender((prev) => !prev);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(() => {
		setSelectedColumn([]);
	}, [data.variation]);

	const tabs = ["Data", "Tools", "JSON"];

	return (
		<div className="[&>.MuiBox-root]:mx-auto [&>.MuiBox-root]:w-[90%]">
			<div className="flex w-full border-b">
				{tabs.map((tab) => (
					<button
						type="button"
						key={tab}
						className={`flex-1 px-4 py-2 font-medium text-sm transition-colors ${
							selectedTab === tab
								? "border-primary border-b-2 text-primary shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
						onClick={() => setSelectedTab(tab)}
					>
						{tab}
					</button>
				))}
			</div>
			<div className="h-full">
				<div
					className="flex flex-col justify-center px-4 py-2"
					style={{
						display: selectedTab === "Data" ? "flex" : "none",
					}}
				>
					{!data.variation && (
						<div className="px-4 py-2">
							<VisualMap
								selectedItem={handleSelectedItem}
								handleClose={() => {}}
							/>
						</div>
					)}
					{data.variation === "echart-bar-graph" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={Bar}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-line-graph" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={Line}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-pie-chart" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={Pie}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-scatter-plots" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={ScatterPlot}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-world-map-chart" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={WorldMap}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-stack-chart" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={StackChart}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-gantt-chart" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={Gantt}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-dendrogram-chart" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={Dendrogram}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
					{data.variation === "echart-word-cloud" && (
						<FrameOperations
							id={id}
							updateFrame={updateFrame}
							path="option"
							chart={Cloud}
							storedColumns={selectedColumn}
							handleStoreData={handleStoreData}
							selectedItem={handleSelectedItem}
						/>
					)}
				</div>
				<div
					className="flex w-full justify-around"
					style={{
						display: selectedTab === "Tools" ? "flex" : "none",
					}}
				>
					<UpgradedVisualizationTool id={id} />
				</div>
				<div
					className="flex h-full flex-col justify-center"
					style={{
						display: selectedTab === "JSON" ? "flex" : "none",
					}}
				>
					<JsonSettings id={id} path="option" height="100vh" />
				</div>
			</div>
		</div>
	);
};
