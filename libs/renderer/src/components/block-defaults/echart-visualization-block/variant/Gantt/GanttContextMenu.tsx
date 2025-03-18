import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { PathValue } from "react-hook-form";
import { Menu, MenuItem } from "@mui/material";

import { EchartVisualizationBlockDef } from "../../../echart-visualization-blocks/VisualizationBlock";
import { useBlock, useFrame } from "../../../../../hooks";

export interface GanttContextMenuProps {
    id: string;
    frame: ReturnType<typeof useFrame>;
    contextMenu: {
        mouseX: number;
        mouseY: number;
        value: any;
    } | null;
    chartInstance: any;
    onClose: () => void;
}
