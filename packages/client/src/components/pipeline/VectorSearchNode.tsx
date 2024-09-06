import { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
    Accordion,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography,
    useNotification,
} from '@semoss/ui';
import { PlayCircle } from '@mui/icons-material';
import { runPixel } from '@/api';
import { useConductor, useRootStore } from '@/hooks';

export function VectorSearchNode({ data, id }) {
    const notification = useNotification();
    const { monolithStore } = useRootStore();
    const { conductor } = useConductor();

    const [nodeOutput, setNodeOutput] = useState();

    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    /**
     * Executes the associated pixel for Node
     * @returns
     */
    const runVectorSearch = async () => {
        let pixel = `VectorDatabaseQuery(`;

        if (!data.engine) {
            notification.add({
                message: 'Please specify the vector engine id',
                color: 'error',
            });
            return;
        } else {
            pixel += `engine=["${data.engine}"], `;
        }

        if (!data.command) {
            notification.add({
                message:
                    'Please specify the command to be ran on vector engine',
                color: 'error',
            });
            return;
        } else {
            const cleaned = await conductor.flattenVariable(data.command, id);
            pixel += `command=["<encode>${cleaned}</encode>"]`;
        }

        if (data.limit) {
            pixel += `, limit=[${data.limit}]`;
        }

        pixel += ');';

        const res = await monolithStore.runQuery(pixel);

        const type = res.pixelReturn[0].operationType;
        const output = res.pixelReturn[0].output;

        if (type.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
            return;
        }

        setNodeOutput(output);

        debugger;
    };

    return (
        <>
            <Handle type="target" position={Position.Left} />
            <Stack
                sx={{
                    border: 'solid 2px red',
                    backgroundColor: 'white',
                    padding: '16px',
                    maxWidth: '600px',
                    maxHeight: '600px',
                }}
                direction="column"
                gap={2}
            >
                <Stack direction={'row'} justifyContent={'space-between'}>
                    <Typography variant={'body2'} fontWeight={'bold'}>
                        Vector Search Node
                    </Typography>

                    <IconButton
                        onClick={() => {
                            runVectorSearch();
                        }}
                    >
                        <PlayCircle />
                    </IconButton>
                </Stack>
                <TextField
                    label={'Vector Id'}
                    value={data.engine}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <TextField
                    multiline
                    rows={5}
                    label={'Command'}
                    value={data.command}
                    onChange={(e) => {
                        console.log('change value on node');
                    }}
                />
                <Divider />
                <Accordion>
                    <Accordion.Trigger>Output</Accordion.Trigger>
                    <Accordion.Content
                        sx={{ maxHeight: '300px', overflow: 'scroll' }}
                    >
                        {JSON.stringify(nodeOutput)}
                    </Accordion.Content>
                </Accordion>
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
