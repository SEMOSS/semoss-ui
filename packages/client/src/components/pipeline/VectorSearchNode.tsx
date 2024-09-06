import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack } from '@semoss/ui';

export function VectorSearchNode({ data, id }) {
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    return (
        <>
            <Handle type="target" position={Position.Left} />
            <Stack
                sx={{
                    border: 'solid 2px red',
                    backgroundColor: 'white',
                    padding: '16px',
                }}
                direction="column"
                gap={2}
            >
                <div>Vector Search Node</div>
                <div>
                    <label htmlFor="text">Engine Id:</label>
                    <input
                        id="text"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
                <div>
                    <label htmlFor="text">Prompt:</label>
                    <input
                        id="text"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                        value={data.prompt}
                    />
                    {data.prompt}
                </div>
            </Stack>
            <Handle
                type="source"
                position={Position.Right}
                id={`vector-${id}-source-${'context'}`}
            />
            {/* <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                style={handleStyle}
            /> */}
        </>
    );
}
