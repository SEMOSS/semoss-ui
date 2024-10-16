import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    TextField,
    Button,
    Typography,
    useNotification,
} from '@semoss/ui';
import { ActionMessages, CellComponent, CellDef, Variant } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { LLMCellVariant } from './LLMCellVariant';
import { Add } from '@mui/icons-material';
import { generateVariantName } from '@/components/block-defaults/llm-comparison-block/LlmComparison.utility';

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

const StyledStack = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledActionButtons = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
}));

export const LLMCell: CellComponent<LLMCellDef> = observer((props) => {
    const { state } = useBlocks();
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const [allModels, setAllModels] = useState<{ name: string; id: string }[]>(
        [],
    );
    const { cell } = props;
    const variants = cell.parameters.variants;
    const command = cell.parameters.command;

    useEffect(() => {
        fetchAllModels();

        if (Object.keys(variants).length === 0) {
            // Create a 'default variant' for the user to configure
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.variants.default',
                    value: {
                        id: 'default',
                        selected: true,
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

    const handleAddVariant = () => {
        const newVariantName = generateVariantName(Object.keys(variants));

        if (newVariantName) {
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: `parameters.variants.${newVariantName}`,
                    value: {
                        id: newVariantName,
                        selected: false,
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
        } else {
            notification.add({
                color: 'error',
                message: 'The maximum number of variants has been met.',
            });
        }
    };

    return (
        <StyledStack gap={3} id={`${cell.query.id} - ${cell.id}`}>
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

            <StyledStack gap={1} direction="column">
                <Typography variant="subtitle1" fontWeight="bold">
                    Variants
                </Typography>

                <div>
                    {Object.keys(variants || {}).map((name, idx) => (
                        <LLMCellVariant
                            key={`variant-${name}-${idx}`}
                            allModels={allModels}
                            variantName={name}
                            cell={cell}
                        />
                    ))}
                </div>

                <StyledActionButtons>
                    <Button
                        variant="text"
                        color="secondary"
                        onClick={handleAddVariant}
                        startIcon={<Add />}
                    >
                        Add Variant
                    </Button>
                </StyledActionButtons>
            </StyledStack>
        </StyledStack>
    );
});
