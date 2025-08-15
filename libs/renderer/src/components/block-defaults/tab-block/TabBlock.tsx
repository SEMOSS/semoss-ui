import { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";

import { Tabs } from "@semoss/ui";

import { Slot } from "../../blocks";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { debounced } from "@semoss/sdk/react";

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
                <Box sx={{ p: 3 }}>
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
        tabLabels: string[]
    };
    slots: {
        [key: `tab-${number}`]: true
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

    console.log(attrs)
    console.log(data)
    console.log(slots)
    console.log(listeners)
    console.log(activeTab)

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

  /**
   * 
   * @param event 
   * @param newValue 
   */
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        debouncedCallback()
    };

// Generate tab items from the tabLabels
    const tabItems = data.tabLabels.map((label, index) => (
        <Tabs.Item 
            key={index + 1}
            label={label} 
            value={index + 1}
            aria-controls={`simple-tabpanel-${index + 1}`}
        />
    ));

    // Get the current active tab's slot
    const activeTabSlotKey = `tab-${activeTab}` as keyof typeof slots;
    const activeTabSlot = slots[activeTabSlotKey];

    console.log(activeTabSlotKey)
    console.log(activeTabSlot)

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
                    style: { display: data.showTabIndicator ? "block" : "none" },
                }}
            >
                {tabItems}
            </Tabs>
            <TabPanel value={activeTab} index={activeTab}>
                {activeTabSlot && (
                    <Slot slot={activeTabSlot} />
                )}
            </TabPanel>
        </Box>
    );
}); 