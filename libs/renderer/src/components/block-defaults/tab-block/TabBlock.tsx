import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { debounced } from "@semoss/sdk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
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
	const { attrs, data, slots, setData, listeners } =
		useBlock<TabBlockDef>(id);
	const [activeTab, setActiveTab] = useState(String(data.activeTab || 1));

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 10);

	useEffect(() => {
		setActiveTab(String(data.activeTab));
	}, [data.activeTab]);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		setData("activeTab", Number(value));
		debouncedCallback();
	};

	const isVertical = data.tabOrientation === "vertical";

	return (
		<div
			{...attrs}
			style={data.style}
			className={isVertical ? "flex flex-row" : "flex flex-col"}
		>
			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				orientation={data.tabOrientation}
				className={isVertical ? "flex w-full flex-row" : "w-full"}
			>
				<TabsList className={isVertical ? "flex h-auto flex-col" : ""}>
					{data.tabLabels.map((label, index) => (
						<TabsTrigger
							key={`tab-trigger-${index + 1}`}
							value={String(index + 1)}
						>
							{label}
						</TabsTrigger>
					))}
				</TabsList>

				{data.tabLabels.map((_, index) => {
					const slotKey = `${index + 1}` as keyof typeof slots;
					const slot = slots[slotKey];
					return (
						<TabsContent
							key={`tab-content-${index + 1}`}
							value={String(index + 1)}
						>
							{slot && <Slot slot={slot} />}
						</TabsContent>
					);
				})}
			</Tabs>
		</div>
	);
});
