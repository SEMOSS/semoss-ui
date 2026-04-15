import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { debounced } from "@semoss/sdk/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface TabBlockDef extends BlockDef<"tab"> {
	widget: "tab";
	data: {
		style: CSSProperties;
		activeTab: number;
		tabOrientation: "horizontal" | "vertical";
		showTabIndicator: boolean;
		textColor: "primary" | "secondary" | "inherit";
		indicatorColor: "primary" | "secondary";
		variant: "standard" | "fullWidth" | "scrollable";
		tabLabels: string[];
	};
	slots: {
		[key: `${number}`]: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const TabBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<TabBlockDef>(id);
	const [activeTab, setActiveTab] = useState(String(data.activeTab || 0));

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 10);

	useEffect(() => {
		setActiveTab(String(data.activeTab || 0));
	}, [data.activeTab]);

	const handleTabChange = (newValue: string) => {
		setActiveTab(newValue);
		debouncedCallback();
	};

	const tabLayoutClass = data.tabOrientation === "vertical" ? "flex-row" : "flex-col";
	const tabsListClass = data.tabOrientation === "vertical" ? "flex-col" : "flex-row";

	return (
		<div {...attrs} style={data.style} className="w-full">
			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className={`flex ${tabLayoutClass}`}
			>
				<TabsList className={`flex ${tabsListClass} w-fit h-auto p-1 gap-1`}>
					{data.tabLabels.map((label, index) => (
						<TabsTrigger
							key={`tab-${index}`}
							value={String(index)}
							className="px-3 py-2 text-sm"
						>
							{label}
						</TabsTrigger>
					))}
				</TabsList>
				{data.tabLabels.map((_, index) => {
					const slotKey = `${index}` as keyof typeof slots;
					const slot = slots[slotKey];
					return (
						<TabsContent
							key={`panel-${index}`}
							value={String(index)}
							className="flex-1"
						>
							{slot && <Slot slot={slot} />}
						</TabsContent>
					);
				})}
			</Tabs>
		</div>
	);
});
