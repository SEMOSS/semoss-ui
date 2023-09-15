import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, Button, TextField } from '@semoss/ui';
import { ActionMessages, useCanvas } from '@semoss/canvas';

export const DesignerEditor = observer(() => {
    const { canvas } = useCanvas();

    const [editBlocks, setEditBlocks] = useState<string>();
    const [editQuery, setEditQuery] = useState<string>();

    useEffect(() => {
        setEditBlocks(JSON.stringify(canvas.blocks, null, 4));
        setEditQuery(JSON.stringify(canvas.queries, null, 4));
    }, [canvas.blocks, canvas.queries]);

    /**
     * Update the canvas onChange
     * @param blocks
     * @param queries
     */
    const onChange = () => {
        try {
            canvas.dispatch({
                message: ActionMessages.SET_STATE,
                payload: {
                    blocks: JSON.parse(editBlocks),
                    queries: JSON.parse(editQuery),
                },
            });
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <>
            <Stack direction={'row'}>
                <Stack flex={1}>
                    <TextField
                        defaultValue={editBlocks}
                        onChange={(e) => setEditBlocks(e.target.value)}
                        label={'Blocks'}
                        multiline={true}
                        rows={8}
                    />
                </Stack>
                <Stack flex={1}>
                    <TextField
                        defaultValue={editQuery}
                        onChange={(e) => setEditQuery(e.target.value)}
                        label={'Query'}
                        multiline={true}
                        rows={8}
                    />
                </Stack>
            </Stack>
            <Stack direction={'row'} justifyContent={'center'}>
                <Button variant="contained" onClick={() => onChange()}>
                    Update
                </Button>
            </Stack>
        </>
    );
});
