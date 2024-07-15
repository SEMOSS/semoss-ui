import { styled, Stack, Button, useNotification } from '@semoss/ui';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLLMComparison } from '@/hooks';
import { ModelVariant } from './ModelVariant';
import { TypeLlmComparisonForm, TypeLlmConfig } from '@/components/workspace';
import { LLMEditor } from './LLMEditor';
import { ArrowBack } from '@mui/icons-material';

const ComparisonFormDefaulValues = {
    models: [],
};

const StyledEditorView = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledAllView = styled(Stack)(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(2),
}));

const StyledActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    padding: `0 ${theme.spacing(2)}`,
}));

export const ConfigureSubMenu = () => {
    const viewRef = useRef('allVariants');
    const notification = useNotification();
    const {
        allModels,
        variants,
        defaultVariant,
        designerView,
        setDesignerView,
        addVariant,
        swapVariantModel,
        setEditorVariant,
        setEditorModel,
        editorVariantIndex,
        editorModelIndex,
        editorVariant,
        editorModel,
    } = useLLMComparison();
    const { control, setValue, handleSubmit, getValues } =
        useForm<TypeLlmComparisonForm>({
            defaultValues: ComparisonFormDefaulValues,
        });

    useEffect(() => {
        if (designerView !== viewRef.current) {
            viewRef.current = designerView;

            if (designerView === 'allVariants') {
                setValue('models', []);
            } else if (designerView === 'variantEdit') {
                setValue('models', editorVariant.models);
            } else if (designerView === 'modelEdit') {
                setValue('models', [editorModel]);
            }
        }
    }, [designerView, editorVariant, editorModel]);

    const onSubmit = (data: TypeLlmComparisonForm) => {
        const { models } = data;
        const selectedModels = models.map((model) => {
            const match = allModels.find((mod) => mod.value === model.value);
            return {
                ...match,
                topP: model.topP || 0,
                temperature: model.temperature || 0,
                length: model.length || 0,
            };
        });

        if (designerView === 'variantEdit') {
            addVariant(editorVariantIndex, {
                name: 'new',
                selected: false,
                models: selectedModels,
            });
            setEditorVariant(null);
        } else if (designerView === 'modelEdit') {
            swapVariantModel(
                editorVariantIndex,
                editorModelIndex,
                selectedModels[0],
            );
            setEditorModel(null, null);
        }

        setDesignerView('allVariants');
    };

    const onError = (errors) => {
        notification.add({
            color: 'error',
            message: 'Fix the errors before saving.',
        });
    };

    const handleResetParams = () => {
        if (designerView === 'variantEdit') {
            setValue('models', editorVariant.models);
        } else if (designerView === 'modelEdit') {
            setValue('models', [editorModel]);
        }
    };

    if (designerView === 'allVariants') {
        return (
            <StyledAllView direction="column" gap={2}>
                <ModelVariant
                    isDefault={true}
                    variant={defaultVariant}
                    index={-1}
                />

                {variants.map((variant, idx: number) => (
                    <ModelVariant
                        variant={variant}
                        index={idx}
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
                            onClick={() => setDesignerView('allVariants')}
                        >
                            Configure
                        </Button>
                    </StyledActionBar>

                    {designerView === 'variantEdit' && (
                        <>
                            {editorVariant.models.map(
                                (model: TypeLlmConfig, idx: number) => (
                                    <LLMEditor
                                        key={`${model.alias}-${idx}`}
                                        control={control}
                                        index={idx}
                                        model={model}
                                    />
                                ),
                            )}
                        </>
                    )}

                    {designerView === 'modelEdit' && (
                        <LLMEditor
                            index={0}
                            control={control}
                            model={editorModel}
                        />
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
