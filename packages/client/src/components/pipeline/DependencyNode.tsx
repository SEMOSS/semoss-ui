import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack } from '@semoss/ui';

const handleStyle = { left: 10 };

export function DependencyNode({ data, id }) {
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    return (
        <>
            <Stack
                sx={{
                    border: 'solid 2px blue',
                    backgroundColor: 'white',
                    padding: '16px',
                    width: '300px',
                }}
                direction="column"
                gap={2}
            >
                Dependency
            </Stack>
            <Handle type="source" position={Position.Bottom} id={id} />
        </>
    );
}
