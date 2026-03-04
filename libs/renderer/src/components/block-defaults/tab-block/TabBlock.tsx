import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { debounced } from "@semoss/sdk/react";
import { Tabs } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

// Custom TabPanel component
interface TabPanelProps {
	children?: React.ReactNode;
	value: number;
	index: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box>
					<div>{children}</div>
				</Box>
			)}
		</div>
	);
}

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
	const [activeTab, setActiveTab] = useState(data.activeTab || 1);

	/**
	 * Process data needed for
	 */
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const debouncedCallback = debounced(() => {
		listeners.onChange();
	}, 10);

	useEffect(() => {
		setActiveTab(data.activeTab);
	}, [data.activeTab]);

	/**
	 *
	 * @param event
	 * @param newValue
	 */
	const handleTabChange = (
		_event: React.SyntheticEvent,
		newValue: number,
	) => {
		setActiveTab(newValue);
		debouncedCallback();
	};

	// Generate tab items from the tabLabels
	const tabItems = data.tabLabels.map((label, index) => (
		<Tabs.Item
			key={`simple-tabpanel-${index + 1}`}
			label={label}
			value={index + 1}
			aria-controls={`simple-tabpanel-${index + 1}`}
		/>
	));

	// Get the current active tab's slot
	const activeTabSlotKey = `${activeTab}` as keyof typeof slots;
	const activeTabSlot = slots[activeTabSlotKey];

	return (
		<Box {...attrs} sx={{ ...data.style }}>
			<Tabs
				value={activeTab}
				onChange={handleTabChange}
				orientation={data.tabOrientation}
				textColor={data.textColor}
				indicatorColor={data.indicatorColor}
				variant={data.variant}
				TabIndicatorProps={{
					style: {
						display: data.showTabIndicator ? "block" : "none",
					},
				}}
			>
				{tabItems}
			</Tabs>
			<TabPanel value={activeTab} index={activeTab}>
				{activeTabSlot && <Slot slot={activeTabSlot} />}
			</TabPanel>
		</Box>
	);
});
