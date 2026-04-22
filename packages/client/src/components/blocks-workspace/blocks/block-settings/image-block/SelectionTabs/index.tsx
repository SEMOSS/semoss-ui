import { Info as InfoOutlinedIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import AppTab from "./App";
import ExternalTab from "./External";
import InsightTab from "./Insight";

type TabRenderProps = {
	id: string;
	// biome-ignore lint/suspicious/noExplicitAny: image block data is untyped
	data: any;
	// biome-ignore lint/suspicious/noExplicitAny: upload callback uses untyped promise
	uploadFile?: (file: File, appId: string, path: string) => Promise<any>;
	appId: string;
	insightId?: string;
	// biome-ignore lint/suspicious/noExplicitAny: setData path/value are dynamically typed
	setData?: (path: string, value: any, force?: boolean) => void;
};

const tabConfig = [
	{
		label: "Insight",
		value: "insight",
		tooltip: "Image generated when the app runs",
		render: ({ insightId, data, setData }: TabRenderProps) => (
			<InsightTab insightId={insightId} data={data} setData={setData} />
		),
	},
	{
		label: "App",
		value: "app",
		tooltip: "Image stored in app assets",
		render: ({ id, data, setData, appId, insightId }: TabRenderProps) => (
			<AppTab
				insightId={insightId}
				data={data}
				setData={setData}
				id={id}
				appId={appId}
			/>
		),
	},
	{
		label: "External",
		value: "external",
		tooltip: "Add image from external link",
		render: ({ id, data, setData }: TabRenderProps) => (
			<ExternalTab id={id} data={data} setData={setData} />
		),
	},
];

const TabsComponent = observer(
	({ data, setData, insightId, appId, id }: TabRenderProps) => {
		const [value, setValue] = useState("insight");

		// biome-ignore lint/suspicious/noExplicitAny: image data value is dynamically typed
		const updateData = (path: string, value: any) => {
			setData(path, value, true);
		};

		const activeTab = tabConfig.find((t) => t.value === value);
		// biome-ignore lint/correctness/useExhaustiveDependencies: updateData is stable within render
		const tabContent = useMemo(
			() =>
				activeTab?.render?.({
					id,
					data,
					setData: updateData,
					appId: appId || "",
					insightId: insightId || "",
				}),
			[value, data],
		);

		return (
			<Tabs
				value={value}
				onValueChange={setValue}
				data-testid="image-tabs"
			>
				<TabsList className="w-full">
					{tabConfig.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className="flex-1"
						>
							{tab.label}
							<Tooltip>
								<TooltipTrigger asChild>
									<InfoOutlinedIcon className="ml-1 size-3" />
								</TooltipTrigger>
								<TooltipContent>{tab.tooltip}</TooltipContent>
							</Tooltip>
						</TabsTrigger>
					))}
				</TabsList>
				<div className="mt-2 flex flex-col">{tabContent}</div>
			</Tabs>
		);
	},
);

export default TabsComponent;
