import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { observer } from 'mobx-react-lite';
import { Button } from '@semoss/ui';
import { ActionMessages, useBlocks } from '@semoss/renderer';

export const CellNode = observer((props: NodeProps) => {
    const { selected, data } = props;
    const { state } = useBlocks();
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

            {/* Block content */}
            {/* <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {data.label || 'Block Node' as string }
            </div> */}
            <div style={{ color: '#555', fontSize: 13 }}>
                {data.description as string}
            </div>
            {data.id}
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

            {/* Bottom handle for outgoing connections */}
            <Handle type="source" position={Position.Bottom} id="source" />
        </div>
    );
});
