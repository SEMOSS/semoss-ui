// QueriesLogBlock.tsx
import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Stack, Typography } from "@mui/material";
import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";

export interface LogsBlockDef extends BlockDef<"logs"> {
    widget: "logs";
    data: {
        style: CSSProperties;
        queryId: string;
        show: string;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const LogsBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<LogsBlockDef>(id);
    const { state } = useBlocks();

    const query = state.getQuery(data.queryId);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    if (!query) {
        return (
            <div style={{ display: "flex", ...data.style }} {...attrs}>
                Attach Query
            </div>
        );
    }

    const blockContents: string[] = [];
    if (query.cells) {
        Object.values(query.cells).forEach((cell) => {
            if (cell.messages) {
                blockContents.push(...cell.messages);
            }
        });
    }

    return (
        <Stack
            style={{ display: "flex", ...data.style }}
            {...attrs}
            direction="column"
            spacing={0}
        >
            {blockContents.map((message, index) => (
                <Typography key={index} variant="caption">
                    {message}
                </Typography>
            ))}
        </Stack>
    );
});
