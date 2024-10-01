import { styled, Stack, Button, useNotification, Typography } from '@semoss/ui';
import { useBlock, useBlocks, useLLMComparison } from '@/hooks';
import { LLMVariant } from './LLMVariant';
import { TypeLlmComparisonForm } from '@/components/workspace';
import { Add, ArrowBack } from '@mui/icons-material';
import { VariantEditor } from './VariantEditor';
import { generateVariantName } from './LlmComparison.utility';
import { ActionMessages, CellState } from '@/stores';
import { observer } from 'mobx-react-lite';
import { LLMCellSelect } from './LLMCellSelect';

const StyledEditorView = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledAllView = styled(Stack)(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(2),
}));

const StyledEditor = styled(Stack)(({ theme }) => ({
    padding: `0 ${theme.spacing(2)} ${theme.spacing(1)}`,
}));

const StyledActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: `0 ${theme.spacing(2)}`,
}));

export const ConfigureSubMenu = observer(() => {
    const notification = useNotification();
    const { setValue, watch, handleSubmit, getValues, blockId } =
        useLLMComparison();
    const { state } = useBlocks();
    const { data } = useBlock(blockId);
    const variants = watch('variants');
    const designerView = watch('designerView');

    // Create/Update the variant being edited.
    const onSubmit = (formData: TypeLlmComparisonForm) => {
        const { editorVariantName, editorVariant } = formData;

        addVariantToAppJson();

        // Update variant in Menu's state
        const newVariants = {
            ...variants,
            [editorVariantName]: editorVariant,
        };
        setValue('variants', newVariants);

        // reset the values for the editor and return to all view.
        clearEditor();
        setValue('designerView', 'allVariants');
    };

    // Find and update cell which the variant being edited applies to.
    const addVariantToAppJson = () => {
        const { editorVariantName, editorVariant } = getValues();

        const modelledVariant = {
            id: editorVariantName,
            sortWeight: 0, // TODO: order variants in future LLM COmparison version
            model: {
                id: editorVariant.model.value || '',
                name: editorVariant.model.database_name || '',
                topP: editorVariant.model.topP || 0,
                temperature: editorVariant.model.temperature || 0,
                length: editorVariant.model.length || 0,
            },
        };

        let query;
        if (
            typeof data.queryId === 'string' &&
            typeof data.cellId === 'string'
        ) {
            query = state.getQuery(data.queryId);
        } else {
            console.log("Type of 'data.queryId' is NOT a string");
            return;
        }

        // clear any pre-populated outputs for each cell and its variants.
        Object.values(query.cells).forEach((cell: CellState) => {
            if (cell.output) {
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId:
                            typeof data.queryId === 'string'
                                ? data.queryId
                                : '',
                        cellId: cell.id,
                        path: `output`,
                        value: undefined,
                    },
                });
            }
        });

        // Update Variant in the cell
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: data.queryId,
                cellId: data.cellId,
                path: `parameters.variants.${editorVariantName}`,
                value: modelledVariant,
            },
        });

        notification.add({
            color: 'success',
            message: `Successfully saved ${
                editorVariantName.toLowerCase === 'default'
                    ? 'Default Variant'
                    : `Variant ${editorVariantName.toUpperCase()}`
            }`,
        });
    };

    const onError = (errors) => {
        notification.add({
            color: 'error',
            message: 'Fix the errors before saving.',
        });
    };

    const clearEditor = () => {
        setValue('editorVariantName', null);
        setValue('editorVariant', null);
    };

    const handleResetParams = () => {
        const variants = getValues('variants');
        const editorVariantName = getValues('editorVariantName');

        if (variants[editorVariantName]) {
            setValue('editorVariant', variants[editorVariantName]);
        } else {
            setValue('editorVariant', { model: {} });
        }
    };

    const handleAddNewVariant = () => {
        const name = generateVariantName(Object.keys(variants));
        setValue('editorVariantName', name);
        setValue('designerView', 'variantEdit');
    };

    if (designerView === 'allVariants') {
        return (
            <StyledAllView direction="column" gap={2}>
                <Typography variant="h6" fontWeight="bold">
                    LLM Cell
                </Typography>

                <LLMCellSelect id={blockId} />

                <Typography variant="h6" fontWeight="bold">
                    Variants
                </Typography>
                {Object.keys(variants).length === 0 && (
                    <Typography variant="body2">
                        Connect an LLM Cell with variants to view them here.
                    </Typography>
                )}

                {Object.keys(variants).map((name, idx: number) => (
                    <LLMVariant
                        variantName={name}
                        variant={variants[name]}
                        key={`variant-${idx}`}
                    />
                ))}

                {Object.keys(variants).length > 0 && (
                    <StyledActionBar>
                        <Button
                            variant="text"
                            color="secondary"
                            startIcon={<Add />}
                            onClick={handleAddNewVariant}
                        >
                            Add Variant
                        </Button>
                    </StyledActionBar>
                )}
            </StyledAllView>
        );
    } else {
        return (
            <StyledEditorView direction="column" gap={1}>
                <div>
                    <StyledActionBar>
                        <Button
                            variant="text"
                            color="secondary"
                            startIcon={<ArrowBack />}
                            onClick={() => {
                                clearEditor();
                                setValue('designerView', 'allVariants');
                            }}
                        >
                            Configure
                        </Button>
                    </StyledActionBar>

                    <StyledEditor>
                        <VariantEditor />
                    </StyledEditor>
                </div>

                <StyledActionBar>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={handleSubmit(onSubmit, onError)}
                    >
                        Save
                    </Button>
                    <Button
                        color="secondary"
                        variant="text"
                        onClick={handleResetParams}
                    >
                        Reset Parameters
                    </Button>
                </StyledActionBar>
            </StyledEditorView>
        );
    }
});
