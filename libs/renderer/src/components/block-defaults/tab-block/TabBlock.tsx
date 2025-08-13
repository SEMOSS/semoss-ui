import React, { useEffect, useState, SyntheticEvent, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { Box, styled, Tabs } from "@semoss/ui";
import { Slot } from "../../blocks";
import { ActionMessages } from "../../../store";
import { debounced } from "@semoss/sdk/react";

export type BoxShadowParts = {
  offsetX?: string;
  offsetY?: string;
  blurRadius?: string;
  spreadRadius?: string;
  color?: string;
};

const TabHeaderWrapper = styled(Box)({
  width: "100%",
  overflowX: "auto",
  alignSelf: "left",
});

const TabWrapper = styled(Tabs.Item)({
  minWidth: "fit-content",
  maxWidth: "fit-content",
});

export interface TabBlockDef extends BlockDef<"tab-block"> {
  widget: "tab-block";
  data: {
    style: React.CSSProperties;
    show: string;
    labels: string[];
    tabLength: number;
  };
  slots: Record<string, true>;
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`custom-tabpanel-${index}`}
      aria-labelledby={`custom-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

function a11yProps(index: number) {
  return {
    id: `custom-tab-${index}`,
    "aria-controls": `custom-tabpanel-${index}`,
  };
}

export const TabBlock: BlockComponent = observer(({ id }) => {
  const { attrs, data, slots, listeners } = useBlock<TabBlockDef>(id);
  const { state } = useBlocks();
  const [value, setValue] = useState(0);
  const tabLength = data.tabLength || 1;

  const debouncedCallback = debounced(() => {
    listeners.onChange();
  }, 10);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    debouncedCallback();
  };

  useEffect(() => {
    if (listeners?.preProcess) {
      listeners.preProcess();
    }
  }, []);

  useEffect(() => {
    if (value >= tabLength) {
      setValue(0);
      return;
    }

    const desiredSlots: Record<string, any> = {};
    for (let i = 0; i < tabLength; i++) {
      const key = `tab${i}`;
      desiredSlots[key] = slots[key] ?? { name: key, children: [] };
    }

    const existingKeys = Object.keys(slots);
    const desiredKeys = Object.keys(desiredSlots);
    const slotsChanged =
      existingKeys.length !== desiredKeys.length ||
      desiredKeys.some((key) => !slots[key]);

    if (slotsChanged) {
      state.dispatch({
        message: ActionMessages.SET_BLOCK_SLOTS,
        payload: {
          id,
          path: "slots",
          value: desiredSlots,
        },
      });
    }
  }, [data.tabLength, value]);

  const visibleTabs = useMemo(
    () =>
      Array.from({ length: tabLength }, (_, idx) => ({
        label: data.labels[idx] ?? `Tab ${idx + 1}`,
        slotKey: `tab${idx}`,
        idx,
      })),
    [tabLength, data.labels]
  );

  return (
    <div style={{ ...data.style }} {...attrs}>
      <TabHeaderWrapper>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"          
          aria-label="scrollable auto tabs example"
        >
          {visibleTabs.map((tab) => (
            <TabWrapper
              key={tab.idx}
              value={tab.idx}
              label={tab.label}
              {...a11yProps(tab.idx)}
            />
          ))}
        </Tabs>
      </TabHeaderWrapper>
      {visibleTabs.map((tab) => (
        <TabPanel value={value} index={tab.idx} key={tab.slotKey}>
          <Slot slot={slots[tab.slotKey]} />
        </TabPanel>
      ))}
    </div>
  );
});
