import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack, Typography } from '@semoss/ui';

export function LLMRunnerNode({ data, id }) {
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    console.log('llm runner node', id);
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                id={`llm-runner-${id}-target-${'prompt'}`}
                style={{ top: `30px` }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id={`llm-runner-${id}-target-${'model'}`}
                style={{ top: `60px` }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id={`llm-runner-${id}-target-${'param-values'}`}
                style={{ top: `90px` }}
            />
            <Stack
                sx={{
                    border: 'solid 2px orange',
                    backgroundColor: 'white',
                    padding: '16px',
                }}
                direction="column"
                gap={2}
            >
                <div>LLM Runner Node</div>
                <Typography variant={'caption'}>
                    Runs the LLM based on required inputs
                </Typography>

                <div>
                    <label htmlFor="text">LLM:</label>
                    <input
                        id="text"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
                <div>
                    <label htmlFor="text">Input:</label>
                    <input
                        id="text"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>

                <div>
                    <label htmlFor="text">Param Values:</label>
                    <input
                        id="text"
                        name="text"
                        onChange={onChange}
                        className="nodrag"
                    />
                </div>
            </Stack>
            <Handle type="source" position={Position.Right} />
            {/* <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                style={handleStyle}
            /> */}
        </>
    );
}
