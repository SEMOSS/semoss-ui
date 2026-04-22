import { useEffect, useState } from "react";
import type {
	BlockComponent,
	EchartVisualizationBlockDef,
} from "@semoss/renderer";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { AIGenerationSettings, JsonSettings } from "../../shared";
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

export const VisualizationBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
	const [selectedTab, setSelectedTab] = useState("Data");
	const [selectedColumn, setSelectedColumn] = useState<string[]>([]);
	const [_forceRender, setForceRender] = useState(false);
	function updateFrame() {}

	// biome-ignore lint/suspicious/noExplicitAny: echart event type
	function handleStoreData(storeData: any[]) {
		const hasValues = storeData.some(
			(item) => item?.values && item?.values.length > 0,
		);
		if (hasValues) {
			setSelectedColumn(storeData);
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: echart event type
	const handleSelectedItem = (item: any) => {
		if (item.title && item.option) {
			data.variation = item.title;
			data.option = item.option;
			if (item?.facet) {
				data.facet = item.facet;
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
				{selectedTab === "Data" && (
					<div className="flex flex-col justify-center px-4 py-2">
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
				)}
				{selectedTab === "Tools" && (
					<div className="flex w-full justify-around">
						<UpgradedVisualizationTool id={id} />
					</div>
				)}
				{selectedTab === "JSON" && (
					<div className="flex h-full flex-col justify-center">
						<JsonSettings id={id} path="option" height="100vh" />
					</div>
				)}
			</div>
			{!data.variation && (
				<AIGenerationSettings
					id={id}
					path="option"
					appendPrompt={"An EChart graph"}
					placeholder="Ex: Generate a E-Chart bar graph."
					valueAsObject
				/>
			)}
		</div>
	);
};
