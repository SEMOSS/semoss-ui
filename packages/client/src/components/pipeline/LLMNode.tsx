import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Divider, Stack, Typography, TextField } from '@semoss/ui';

const handleStyle = { left: 10 };

export function LLMNode({ data, id }) {
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    return (
        <>
            <Stack
                sx={{
                    border: 'solid 2px green',
                    backgroundColor: 'white',
                    padding: '16px',
                    width: '500px',
                }}
                direction="column"
                gap={2}
            >
                <div>LLM Node</div>
                <Typography variant={'caption'}>
                    LLM Configuration info to be used in an LLM Runner Node
                </Typography>
                <TextField
                    label={'Model Id'}
                    value={data.engine_id}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <TextField
                    label={'Temperature'}
                    value={data.temperature}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <TextField
                    label={'Token Length'}
                    value={data.token_length}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <TextField
                    label={'Top P'}
                    value={data.top_p}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <Divider />
                Output:{' '}
                {JSON.stringify({
                    id: data.id,
                    temperature: data.temperature,
                    top_p: data.top_p,
                    token_length: data.token_length,
                })}
            </Stack>
            <Handle
                type="source"
                position={Position.Right}
                id={`llm-${id}-source-${'model'}`}
            />
        </>
    );
}
