import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack, Typography } from '@semoss/ui';

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
                <div>
                    <label htmlFor="text">Model:</label>
                    <input
                        id="Model"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
                <div>
                    <label htmlFor="text">Temperature:</label>
                    <input
                        id="Temperature"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
                <div>
                    <label htmlFor="text">Top P:</label>

                    <input
                        id="Top P"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
                <div>
                    <label htmlFor="text">Token Length:</label>
                    <input
                        id="Token Length"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
            </Stack>
            <Handle
                type="source"
                position={Position.Right}
                id={`llm-${id}-source-${'model'}`}
            />
        </>
    );
}
