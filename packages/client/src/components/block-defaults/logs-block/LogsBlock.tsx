// QueriesLogBlock.tsx
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, Typography } from '@mui/material';
import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface LogsBlockDef extends BlockDef<'logs'> {
    widget: 'logs';
    data: {
        style: CSSProperties;
        queryId: string;
    };
}

export const LogsBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<LogsBlockDef>(id);
    const { state } = useBlocks();

    const query = state.getQuery(data.queryId);

    if (!query) {
        return (
            <div style={{ display: 'flex', ...data.style }} {...attrs}>
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
            style={{ display: 'flex', ...data.style }}
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
