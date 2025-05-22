import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Button, Stack, Typography } from '@semoss/ui';
import { ActionMessages, useBlocks } from '@semoss/renderer';

interface CellNodeProps {
    selected: boolean;
    data: {
        description: string;
        id: string;
        queryId: string;
    };
}

export const CellNode = observer((props: CellNodeProps) => {
    const { selected, data } = props;
    const { state } = useBlocks();

    const q = state.getQuery(data.queryId);
    const index = q.list.indexOf(data.id);

    return (
        <div
            style={{
                border: selected ? '2px solid red' : '1px solid #bbb',
                borderRadius: 8,
                padding: 16,
                background: '#fff',
                minWidth: 180,
                boxShadow: selected ? '0 0 6px red' : '0 1px 4px #0001',
                fontFamily: 'Roboto, sans-serif',
            }}
        >
            {/* Top handle for incoming connections */}
            <Handle type="target" position={Position.Top} id="target" />
            {/* Bottom handle for outgoing connections */}
            <Handle type="source" position={Position.Bottom} id="source" />

            <Stack>
                <Typography variant={'h5'}>{data.queryId}</Typography>
                <Typography variant={'h6'}>Cell # {index + 1}</Typography>
                <Button
                    onClick={() => {
                        state.dispatch({
                            message: ActionMessages.RUN_CELL,
                            payload: {
                                cellId: data.id as string,
                                queryId: data.queryId as string,
                            },
                        });
                    }}
                >
                    Run
                </Button>
            </Stack>
        </div>
    );
});
