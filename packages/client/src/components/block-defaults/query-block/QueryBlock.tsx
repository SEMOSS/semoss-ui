import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface QueryBlockDef extends BlockDef<'query'> {
    widget: 'query';
    data: {
        style: CSSProperties;
        queryId: string;
        stepId: string;
    };
    slots: never;
}

export const QueryBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<QueryBlockDef>(id);

    const { state } = useBlocks();

    // get the step
    const query = state.getQuery(data.queryId);
    const step = query && data.stepId ? query.getStep(data.stepId) : null;

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
            {step
                ? JSON.stringify(step.output, null, 4)
                : JSON.stringify(query.output, null, 4)}
        </div>
    );
});
