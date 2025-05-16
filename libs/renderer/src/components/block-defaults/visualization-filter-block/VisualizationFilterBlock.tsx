import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { Box, styled, Typography } from "@semoss/ui";

const FilterContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    padding: theme.spacing(0.5),
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing(1.25),
    alignSelf: "stretch",
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
}));

const FilterHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    height: theme.spacing(5),
    alignItems: "center",
    gap: theme.spacing(1.25),
    flexShrink: 0,
    alignSelf: "stretch",
    borderRadius: theme.shape.borderRadius / 4,
    backgroundColor: "#F5F9FE",
    padding: theme.spacing(0, 1.25),
}));

const FilterBody = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(1.25),
}));
export interface VisualizationFilterBlockDef extends BlockDef<"visualization-filter"> {
    widget: "visualization-filter";
    data: {
        style: CSSProperties;
        displayType: string,
        frame: string,
        column: string,
        filterType: string,
        show: string;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}


export const VisualizationFilterBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<VisualizationFilterBlockDef>(id);
    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
        console.log("data", data)
    }, [data]);
    return (
        <div
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            <FilterContainer>
                <FilterHeader>
                    <Typography variant="subtitle1">Vizualization filter</Typography>
                </FilterHeader>
                <FilterBody>
                    <Typography variant="body2" color="secondary">Select data to display filter results</Typography>
                </FilterBody>
            </FilterContainer>
        </div>
    );
});
