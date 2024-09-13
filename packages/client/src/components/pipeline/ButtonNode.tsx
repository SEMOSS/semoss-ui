import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack } from '@semoss/ui';

const handleStyle = { left: 10 };

export function ButtonNode({ data }) {
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
                <div>Button Node</div>
                <div>Executes</div>
            </Stack>
            <Handle type="source" position={Position.Right} id="a" />
            {/* <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                style={handleStyle}
            /> */}
        </>
    );
}
