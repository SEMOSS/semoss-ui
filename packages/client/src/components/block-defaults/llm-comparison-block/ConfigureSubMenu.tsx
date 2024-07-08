import { styled, Stack } from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { ModelVariant } from './ModelVariant';

export const ConfigureSubMenu = () => {
    const { variants, defaultVariant, designerView } = useLLMComparison();

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

            {designerView === 'editVariant' && <></>}

            {designerView === 'editModel' && <></>}
        </Stack>
    );
};
