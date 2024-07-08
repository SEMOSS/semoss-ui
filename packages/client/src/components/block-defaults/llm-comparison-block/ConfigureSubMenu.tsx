import { styled, Stack } from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { ModelVariant } from './ModelVariant';
import { TypeLlmConfig } from '@/components/workspace';
import { LLMEditor } from './LLMEditor';

export const ConfigureSubMenu = () => {
    const {
        variants,
        defaultVariant,
        designerView,
        editorVariantIndex,
        editorModelIndex,
    } = useLLMComparison();

    return (
        <Stack direction="column" gap={2}>
            {designerView === 'allVariants' && (
                <>
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
                </>
            )}

            {designerView === 'editVariant' && (
                <>
                    {variants[editorVariantIndex].models.map(
                        (model: TypeLlmConfig, idx: number) => (
                            <LLMEditor
                                key={`${model.alias}-${idx}`}
                                model={model}
                                index={idx}
                            />
                        ),
                    )}
                </>
            )}

            {designerView === 'editModel' && (
                <LLMEditor
                    model={
                        variants[editorVariantIndex]?.models[editorModelIndex]
                    }
                    index={editorModelIndex}
                />
            )}
        </Stack>
    );
};
