import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Divider, Stack, TextField, Typography } from '@semoss/ui';

const handleStyle = { left: 10 };

export function PromptNode({ data, id }) {
    const output =
        `Context: ${data.context}` +
        `\n` +
        `---------------------` +
        `\n` +
        `${data.prompt}` +
        `\n`;
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                id={`prompt-${id}-target-${'context'}`}
            />
            <Handle
                type="target"
                position={Position.Left}
                id={`prompt-${id}-target-${'input'}`}
            />
            <Stack
                sx={{
                    border: 'solid 2px yellow',
                    backgroundColor: 'white',
                    padding: '16px',
                    width: '500px',
                }}
                direction="column"
                gap={2}
            >
                <div>Prompt Node</div>
                <Typography variant={'caption'}>
                    Configuration on the prompt we want to pass to the LLM
                    Runner
                </Typography>
                <TextField
                    multiline
                    rows={2}
                    label={'Context'}
                    value={data.context}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <TextField
                    multiline
                    rows={5}
                    label={'Prompt'}
                    value={data.prompt}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <Divider />
                <Stack direction={'column'} gap={1}>
                    <Typography variant={'body2'}>Output</Typography>
                    {output}
                </Stack>
            </Stack>
            <Handle
                type="source"
                position={Position.Right}
                id={`prompt-${id}-source-${'prompt'}`}
            />
        </>
    );
}
