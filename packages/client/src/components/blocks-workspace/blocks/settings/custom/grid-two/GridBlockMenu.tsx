import { useState } from "react";
import { type BlockComponent, useBlock } from "@semoss/renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import { JsonSettings } from "../../shared/JsonSettings";
import { GridBlockColumnSettings } from "./GridBlockColumnSettings";
import { GridBlockTool } from "./GridBlockTool";

export const GridBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);

	const [selectedTab, setSelectedTab] = useState("Tools");

	return (
		<div className="[&>.MuiBox-root]:mx-auto [&>.MuiBox-root]:w-[90%]">
			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList className="w-full">
					<TabsTrigger value="Data" className="flex-1">
						Data
					</TabsTrigger>
					<TabsTrigger value="Tools" className="flex-1">
						Tools
					</TabsTrigger>
					<TabsTrigger value="JSON" className="flex-1">
						JSON
					</TabsTrigger>
				</TabsList>
				<div className="max-h-[50vh]">
					<TabsContent value="Data">
						<div className="flex flex-col justify-center px-4 py-2">
							{data.variation === "grid-block" && (
								<GridBlockColumnSettings id={id} />
							)}
						</div>
					</TabsContent>
					<TabsContent value="Tools">
						<div className="flex w-full justify-start">
							<GridBlockTool id={id} />
						</div>
					</TabsContent>
					<TabsContent value="JSON">
						<div className="flex flex-col justify-center">
							<JsonSettings
								id={id}
								path="option"
								height="100vh"
							/>
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};
