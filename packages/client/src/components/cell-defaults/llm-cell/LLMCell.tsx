import { useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Button, Stack, TextField, Grid, Tabs } from '@semoss/ui';
import { Code, KeyboardArrowDown } from '@mui/icons-material';
import { runPixel } from '@/api';
import { ActionMessages, CellComponent, Variable, CellDef } from '@/stores';
import { useBlocks } from '@/hooks';
import { JSONEditor } from './JSONEditor';

export interface LLMCellDef extends CellDef<'llm'> {
    widget: 'llm';
    parameters: {
        /**
         * Model to use
         */
        modelId: string;

        /**
         * what you want to ask
         */
        command: string;

        /**
         * guardrails to pass to llm
         */
        paramValues: Record<string, any>;
    };
}

const StyledContent = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
    width: '100%',
    // border: 'solid red',
}));

const StyledGridItem = styled(Grid)(({ theme }) => ({
    width: '100%',
    // border: 'solid red',
}));

export const LLMCell: CellComponent<LLMCellDef> = observer((props) => {
    const { cell } = props;

    const { state } = useBlocks();

    const [jsonView, setJsonView] = useState<'editor' | 'text-field'>('editor');

    useEffect(() => {
        // console.log(cell.query.id);
        // console.log(cell.id);
        // console.log(cell.parameters.modelId);
        // console.log(cell.parameters.command);
        console.log(cell.parameters.paramValues);
    }, [cell.parameters.modelId, cell.parameters.command]);

    const id = cell.parameters.modelId;
    const command = cell.parameters.command;
    const params = cell.parameters.paramValues;

    const handleChange = (newValue, path) => {
        if (cell.isLoading) {
            return;
        }

        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: path,
                value: newValue,
            },
        });
    };

    return (
        <StyledContent id={`${cell.query.id} - ${cell.id}`}>
            <StyledGrid container width={'100%'}>
                <StyledGridItem item xs={6}>
                    <Stack gap={1}>
                        <TextField
                            // disabled={true}
                            value={id}
                            label={'Model to use'}
                            fullWidth
                            onChange={(e) => {
                                handleChange(
                                    e.target.value,
                                    'parameters.modelId',
                                );
                            }}
                        />
                        <TextField
                            value={command}
                            label={'Command'}
                            multiline={true}
                            rows={4}
                            fullWidth
                            onChange={(e) => {
                                handleChange(
                                    e.target.value,
                                    'parameters.command',
                                );
                            }}
                        />
                    </Stack>
                </StyledGridItem>
                <StyledGridItem item xs={6}>
                    <Stack>
                        <Grid container gap={1}>
                            <Grid item xs={2}>
                                <Tabs
                                    orientation="vertical"
                                    value={jsonView}
                                    onChange={(
                                        e,
                                        v: 'editor' | 'text-field',
                                    ) => {
                                        setJsonView(v);
                                    }}
                                >
                                    <Tabs.Item
                                        label={'Editor'}
                                        value={'editor'}
                                    />
                                    <Tabs.Item
                                        label={'Fields'}
                                        value={'text-field'}
                                    />
                                </Tabs>
                            </Grid>
                            <Grid item xs={9}>
                                <JSONEditor
                                    view={jsonView}
                                    value={params}
                                    onChange={(
                                        val: Record<string, unknown>,
                                    ) => {
                                        console.log('');
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </StyledGridItem>
            </StyledGrid>

            {/* <TextField disabled={true} value={}label={'Parameters'} /> */}
        </StyledContent>
    );
});
