import { styled, Stack, Button } from '@semoss/ui';
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

const StyledView = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
}));

export const ConfigureSubMenu = () => {
    const viewRef = useRef('allVariants');
    const {
        variants,
        defaultVariant,
        designerView,
        setDesignerView,
        editorVariant,
        editorModel,
    } = useLLMComparison();
    const { handleSubmit, control, setValue } = useForm<TypeLlmComparisonForm>({
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

    const onSubmit = () => {
        //TODO
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
            <StyledView direction="column" gap={2}>
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
            </StyledView>
        );
    } else {
        return (
            <StyledView direction="column" gap={1}>
                <div>
                    <Button
                        variant="text"
                        color="secondary"
                        startIcon={<ArrowBack />}
                        onClick={() => setDesignerView('allVariants')}
                    >
                        Configure
                    </Button>

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
                        onClick={onSubmit}
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
            </StyledView>
        );
    }
};
