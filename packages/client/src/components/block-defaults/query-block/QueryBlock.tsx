import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface QueryBlockDef extends BlockDef<'query'> {
    widget: 'query';
    data: {
        style: CSSProperties;
        queryId: string;
        cellId: string;
    };
    slots: never;
}

export const QueryBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<QueryBlockDef>(id);

    const { state } = useBlocks();

    // get the cell
    const query = state.getQuery(data.queryId);
    const cell = query && data.cellId ? query.getCell(data.cellId) : null;

    if (!query) {
        return (
            <div
                style={{
                    display: 'flex',
                    ...data.style,
                }}
                {...attrs}
            >
                Attach Query
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                ...data.style,
            }}
            {...attrs}
        >
            {cell
                ? JSON.stringify(cell.output, null, 4)
                : JSON.stringify(query.output, null, 4)}
        </div>
    );
});
