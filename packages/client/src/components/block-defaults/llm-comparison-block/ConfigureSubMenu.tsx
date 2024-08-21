import { styled, Stack, Button, useNotification } from '@semoss/ui';
import { useEffect, useRef } from 'react';
import { useBlocks, useLLMComparison } from '@/hooks';
import { ModelVariant } from './ModelVariant';
import { TypeLlmComparisonForm, TypeLlmConfig } from '@/components/workspace';
import { LLMEditor } from './LLMEditor';
import { ArrowBack } from '@mui/icons-material';
import { VariantEditor } from './VariantEditor';
import { ActionMessages, Variant } from '@/stores';
import { emptyModel } from './LlmComparison.utility';

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
    const { allModels, setValue, watch, handleSubmit, getValues } =
        useLLMComparison();
    const defaultVariant = watch('defaultVariant');
    const variants = watch('variants');
    const designerView = watch('designerView');
    const ModelsInEditor = watch('ModelsInEditor');

    // When the designer view changes, set the relevant values for the editor
    useEffect(() => {
        if (designerView !== viewRef.current) {
            viewRef.current = designerView;
            const { editorVariantName, editorModelIndex, variants } =
                getValues();

            if (designerView === 'variantEdit') {
                if (editorVariantName) {
                    setValue(
                        'ModelsInEditor',
                        variants[editorVariantName].models,
                    );
                } else {
                    const modelCount = defaultVariant.models.length;
                    const emptyModels = Array(modelCount).fill(emptyModel);
                    setValue('ModelsInEditor', emptyModels);
                }
            } else if (designerView === 'modelEdit') {
                const selectedModel =
                    variants[editorVariantName].models[editorModelIndex];
                setValue('ModelsInEditor', selectedModel);
            }
        }
    }, [designerView]);

    const onSubmit = (data: TypeLlmComparisonForm) => {
        // TODO: error check that "newVariantName" is required and is unique.
        const { ModelsInEditor, newVariantName } = data;

        if (designerView === 'variantEdit') {
            addVariantToAppJson();

            const variantsCopy = { ...getValues('variants') };
            variantsCopy[newVariantName] = {
                selected: true,
                models: ModelsInEditor,
            };
            setValue('variants', variantsCopy);

            clearEditor('variant');
        } else if (designerView === 'modelEdit') {
            // TODO: fire action to update Variant in APP JSON,
            //       and update state in Comparison Menu's form state
            updateVariantInAppJson();
            clearEditor('model');
        }

        setValue('designerView', 'allVariants');
    };

    const addVariantToAppJson = () => {
        const { ModelsInEditor, newVariantName } = getValues();

        const models = ModelsInEditor.map((mod: TypeLlmConfig) => ({
            id: mod.value,
            name: mod.database_name,
            topP: mod.topP,
            temperature: mod.temperature,
            length: mod.length,
        }));
        const modelledVariant: Variant = {
            to: '',
            models,
        };

        const success = state.dispatch({
            message: ActionMessages.ADD_VARIANT,
            payload: {
                id: newVariantName,
                variant: modelledVariant,
            },
        });

        notification.add({
            color: success ? 'success' : 'error',
            message: success
                ? `Successfully saved Variant ${newVariantName}`
                : `Unable to save your Variant, due to syntax or a duplicated alias`,
        });
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

    const clearEditor = (type: 'model' | 'variant') => {
        if (type === 'variant') {
            setValue('editorVariantName', null);
            setValue('editorVariant', null);
            setValue('newVariantName', null);
            setValue('ModelsInEditor', []);
        } else {
            setValue('editorVariantName', null);
            setValue('editorModelIndex', null);
            setValue('ModelsInEditor', []);
        }
    };

    const handleResetParams = () => {
        const variants = getValues('variants');
        const editorVariantName = getValues('editorVariantName');
        const editorModelIndex = getValues('editorModelIndex');

        if (designerView === 'variantEdit') {
            if (editorVariantName) {
                setValue('ModelsInEditor', variants[editorVariantName].models);
            } else {
                const modelCount = defaultVariant.models.length;
                const emptyModels = Array(modelCount).fill(emptyModel);
                setValue('ModelsInEditor', emptyModels);
            }
        } else if (designerView === 'modelEdit') {
            const model = variants[editorVariantName].models[editorModelIndex];
            setValue('ModelsInEditor', [model]);
        }
    };

    if (designerView === 'allVariants') {
        return (
            <StyledAllView direction="column" gap={2}>
                <ModelVariant
                    isDefault={true}
                    variantName="default"
                    variant={defaultVariant}
                />

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
                                clearEditor(
                                    designerView === 'variantEdit'
                                        ? 'variant'
                                        : 'model',
                                );
                                setValue('designerView', 'allVariants');
                            }}
                        >
                            Configure
                        </Button>
                    </StyledActionBar>

                    {designerView === 'variantEdit' && (
                        <StyledEditor>
                            <VariantEditor />
                        </StyledEditor>
                    )}

                    {designerView === 'modelEdit' && (
                        <StyledEditor>
                            {ModelsInEditor.map(
                                (model: TypeLlmConfig, idx: number) => (
                                    <LLMEditor
                                        key={`LLM-${model.value}-${idx}`}
                                        model={model}
                                        index={idx}
                                    />
                                ),
                            )}
                        </StyledEditor>
                    )}
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
