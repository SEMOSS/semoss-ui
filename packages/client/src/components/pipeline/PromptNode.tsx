import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack, Typography } from '@semoss/ui';

const handleStyle = { left: 10 };

export function PromptNode({ data, id }) {
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

                <div>
                    <label htmlFor="text">Context:</label>
                    <input
                        id="context"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
                <div>
                    <label htmlFor="text">Prompt:</label>
                    <input
                        id="prompt"
                        name="text"
                        onChange={onChange}
                        value={data.prompt}
                        className="nodrag"
                    />
                </div>
                <Typography variant={'caption'}>{data.prompt}</Typography>
            </Stack>
            <Handle
                type="source"
                position={Position.Right}
                id={`prompt-${id}-source-${'prompt'}`}
            />
        </>
    );
}
