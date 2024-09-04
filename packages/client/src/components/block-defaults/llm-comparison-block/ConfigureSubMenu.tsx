import { styled, Stack, Button, useNotification } from '@semoss/ui';
import { useEffect, useRef } from 'react';
import { useBlocks, useLLMComparison } from '@/hooks';
import { ModelVariant } from './ModelVariant';
import { TypeLlmComparisonForm } from '@/components/workspace';
import { ArrowBack } from '@mui/icons-material';
import { VariantEditor } from './VariantEditor';

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
    gap: theme.spacing(2),
    padding: `0 ${theme.spacing(2)}`,
}));

export const ConfigureSubMenu = () => {
    const viewRef = useRef('allVariants');
    const notification = useNotification();
    const { state } = useBlocks();
    const { setValue, watch, handleSubmit, getValues } = useLLMComparison();
    const variants = watch('variants');
    const designerView = watch('designerView');

    // When the designer view changes, set the relevant values for the editor
    useEffect(() => {
        if (designerView !== viewRef.current) {
            viewRef.current = designerView;
            const { editorVariantName, editorVariant, variants } = getValues();

            if (designerView === 'variantEdit') {
                if (editorVariantName) {
                    // Handle case for editing saved variant
                    setValue('editorVariant', variants[editorVariantName]);
                } else {
                    // Handle case for creating a new variant
                    // TODO: create a name for the new variant and save to state
                    setValue('editorVariant', { model: {} });
                }
            }
        }
    }, [designerView]);

    const onSubmit = (data: TypeLlmComparisonForm) => {
        const { editorVariantName, editorVariant } = data;

        // TODO: fire action to update Variant in APP JSON,
        //       and update state in Comparison Menu's form state
        addVariantToAppJson();

        // TODO: figure out sort weight
        const variantsCopy = { ...getValues('variants') };
        variantsCopy[editorVariantName] = {
            model: editorVariant.model,
        };
        setValue('variants', variantsCopy);

        clearEditor();
        setValue('designerView', 'allVariants');
    };

    const addVariantToAppJson = () => {
        const { editorVariant, editorVariantName } = getValues();

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

    if (designerView === 'allVariants') {
        return (
            <StyledAllView direction="column" gap={2}>
                {Object.keys(variants).map((name, idx: number) => (
                    <ModelVariant
                        variantName={name}
                        variant={variants[name]}
                        key={`variant-${idx}`}
                    />
                ))}
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
