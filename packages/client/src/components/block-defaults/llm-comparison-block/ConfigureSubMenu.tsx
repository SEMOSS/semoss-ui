import { styled, Stack, Button, useNotification, Typography } from '@semoss/ui';
import { useBlocks, useLLMComparison } from '@/hooks';
import { LLMVariant } from './LLMVariant';
import { TypeLlmComparisonForm } from '@/components/workspace';
import { Add, ArrowBack } from '@mui/icons-material';
import { VariantEditor } from './VariantEditor';
import { QueryNameDropdownSettings } from '@/components/block-settings/custom/QueryNameDropdownSettings';
import { generateVariantName } from './LlmComparison.utility';

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

export const ConfigureSubMenu = ({ blockId }) => {
    const notification = useNotification();
    const { setValue, watch, handleSubmit, getValues } = useLLMComparison();
    const variants = watch('variants');
    const designerView = watch('designerView');

    const onSubmit = (data: TypeLlmComparisonForm) => {
        const { editorVariantName, editorVariant } = data;

        // TODO: fire action to update Variant in APP JSON,
        //       and update state in Comparison Menu's form state
        //       and clear any outputs in the cell
        addVariantToAppJson();

        clearEditor();
        setValue('designerView', 'allVariants');
    };

    const addVariantToAppJson = () => {
        const { editorVariantName } = getValues();

        // TODO: fix to update cell in App Json
        // const models = ModelsInEditor.map((mod: TypeLlmConfig) => ({
        //     id: mod.value,
        //     name: mod.database_name,
        //     topP: mod.topP,
        //     temperature: mod.temperature,
        //     length: mod.length,
        // }));
        // const modelledVariant: Variant = {
        //     id: newVariantName,
        //     to: '',
        //     models,
        // };

        // notification.add({
        //     color: success ? 'success' : 'error',
        //     message: success
        //         ? `Successfully saved Variant ${newVariantName}`
        //         : `Unable to save your Variant, due to syntax or a duplicated alias`,
        // });
    };

    const updateVariantInAppJson = () => {
        // TODO: grab model being updated and save it to form state and app JSON
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
                    LLM Query
                </Typography>
                <QueryNameDropdownSettings
                    id={blockId}
                    label="Query"
                    path="queryId"
                />

                <Typography variant="h6" fontWeight="bold">
                    Variants
                </Typography>
                {Object.keys(variants).length === 0 && (
                    <Typography variant="body2">
                        Connect an LLM Query with variants to view them here.
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
};
