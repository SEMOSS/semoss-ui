import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Stack, TextField, Grid, Typography } from '@semoss/ui';
import { ActionMessages, CellComponent, CellDef, Variant } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { LLMCellVariant } from './LLMCellVariant';

export interface LLMCellDef extends CellDef<'llm'> {
    widget: 'llm';
    parameters: {
        // what you want to ask
        command: string;

        // variants used to create responses to compare LLMs against
        variants: { [name: string]: Variant };
    };
}

type ModelEngine = {
    name: string;
    databaseId: string;
    topP: number;
    temperature: number;
    length: number;
};

const StyledContent = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledStack = styled(Grid)(({ theme }) => ({
    width: '100%',
}));

export const LLMCell: CellComponent<LLMCellDef> = observer((props) => {
    const { state } = useBlocks();
    const { monolithStore } = useRootStore();
    const [allModels, setAllModels] = useState<{ name: string; id: string }[]>(
        [],
    );
    const { cell } = props;
    const variants = cell.parameters.variants;
    const command = cell.parameters.command;

    useEffect(() => {
        fetchAllModels();

        if (!variants) {
            // Create a 'default variant' for the user to configure
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.variants.default',
                    value: {
                        id: 'default',
                        to: '',
                        sortWeight: 0,
                        model: {
                            id: '',
                            name: '',
                            topP: 0,
                            temperature: 0,
                            length: 0,
                        },
                    },
                },
            });
        }
    }, []);
    console.log('RENDERRRRRR', variants);

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = res.pixelReturn[0].output.map((model) => {
            return {
                name: model.database_name,
                id: model.database_id,
            };
        });
        setAllModels(modelled);
    };

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
            <StyledStack gap={3}>
                <TextField
                    value={command}
                    label={'Command'}
                    multiline={true}
                    rows={4}
                    fullWidth
                    onChange={(e) => {
                        handleChange(e.target.value, 'parameters.command');
                    }}
                />

                <Typography variant="subtitle1">Variants</Typography>

                {Object.keys(variants || {}).map((name, idx) => (
                    <LLMCellVariant
                        key={`variant-${name}-${idx}`}
                        allModels={allModels}
                        variantName={name}
                        variant={variants[name]}
                    />
                ))}
            </StyledStack>
        </StyledContent>
    );
});
