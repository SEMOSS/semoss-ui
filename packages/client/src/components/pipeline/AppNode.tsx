import { useCallback } from 'react';
import { Handle, Position, HandleProps, EdgeText } from '@xyflow/react';
import { Stack, Typography } from '@semoss/ui';
import { BlocksRenderer } from '../blocks-workspace';

const handleStyle = { left: 10 };

export function AppNode({ data }) {
    let inputPos = 0;
    let outputPos = 0;

    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    // console.log('App Node', data);

    const outputs = [...data.inputs, ...data.outputs];

    return (
        <>
            {data.inputs.map((input, i) => {
                inputPos += 30;
                return (
                    <Handle
                        id={`app-${data.appId}-target-${input}`}
                        key={i}
                        type="target"
                        position={Position.Left}
                        style={{ top: `${inputPos}px` }}
                    />
                );
            })}
            <Stack
                sx={{
                    border: 'solid 2px blue',
                    backgroundColor: 'white',
                    padding: '16px',
                    width: '500px',
                }}
                direction="column"
                gap={2}
            >
                <div>App Agent</div>
                <Typography variant={'caption'}>
                    App Agent that runs the app based on required inputs, how do
                    we run app without UI clicks?
                </Typography>
                <Typography variant={'caption'}>{data.description}</Typography>
                <Stack>
                    <Typography variant={'body1'}> Inputs</Typography>
                    {data.inputs.map((input, i) => {
                        return (
                            <Typography key={i} variant={'caption'}>
                                {'Target: '}
                                {input},{' '}
                            </Typography>
                        );
                    })}
                </Stack>
                <Stack>
                    <Typography variant={'body1'}> Outputs</Typography>
                    {data.outputs.map((output, i) => {
                        return (
                            <Typography key={i} variant={'caption'}>
                                {'Source: '}
                                {output},{' '}
                            </Typography>
                        );
                    })}
                </Stack>
                <Stack sx={{ width: '450px', height: '200px' }}>
                    {Object.keys(data.state).length && (
                        <BlocksRenderer state={data.state} />
                    )}
                </Stack>
            </Stack>
            {outputs.map((output, i) => {
                outputPos += 30;
                return (
                    <Handle
                        key={i}
                        type="source"
                        id={`app-${data.appId}-source-${output}`}
                        position={Position.Right}
                        style={{ top: `${outputPos}px` }}
                    />
                );
            })}
            {/* Dynamically add handles for each input for app */}
            {/* <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                style={handleStyle}
            /> */}
        </>
    );
}
