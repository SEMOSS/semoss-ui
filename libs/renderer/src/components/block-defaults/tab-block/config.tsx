import { BlockConfig } from "../../../store";
import { TabBlockDef, TabBlock } from "./TabBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<TabBlockDef> = {
  widget: "tab-block",
  type: BLOCK_TYPE_LAYOUT,
  data: {
    show: "true",
    style: {
      display: "flex",
      flexDirection: "column",
      padding: "4px",
      gap: "8px",
      flexWrap: "wrap",
    },
    labels: ["Tab - 1", "Tab - 2", "Tab - 3"],
    tabLength: 3,
  },
  listeners: {
    preProcess: { type: "sync", order: [] },
    onChange: { type: "sync", order: [] },
  },
  slots: {
    tab0: [],
    tab1: [],
    tab2: [],
  },
  render: TabBlock,
};
