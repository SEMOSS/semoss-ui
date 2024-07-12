import { Stack, Typography, styled, Checkbox, Switch } from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { useEffect, useState } from 'react';
import { TypeVariant } from '@/components/workspace';

const StyledSettingsSubMenu = styled('div')(({ theme }) => ({
    width: '100%',
}));

const StyledHeader = styled('div')(({ theme }) => ({
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing(2),
}));

const StyledSection = styled(Stack)(({ theme }) => ({
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
}));

export const SettingsSubMenu = () => {
    const {
        showModelsInResponse,
        toggleShowModelsInResponse,
        defaultVariant,
        variants,
        editVariant,
    } = useLLMComparison();
    const [selectedVars, setSelectedVars] = useState<TypeVariant[]>([]);
    const [unselectedVars, setUnselectedVars] = useState<TypeVariant[]>([]);

    useEffect(() => {
        setVariantsState(variants);
    }, [variants]);

    const setVariantsState = (vars: TypeVariant[]) => {
        const selected = [];
        const unselected = [];

        vars.forEach((variant) => {
            if (variant.selected) {
                selected.push(variant);
            } else {
                unselected.push(variant);
            }
        });

        setSelectedVars(selected);
        setUnselectedVars(unselected);
    };

    const handleToggleSelected = (
        variant: TypeVariant,
        isDefault?: boolean,
    ) => {
        if (isDefault) {
            const newDefault = {
                ...defaultVariant,
                selected: !defaultVariant.selected,
            };
            editVariant(-1, newDefault);
        } else {
            const copy = [...variants];
            const idx = copy.findIndex((vrnt) => variant.name === vrnt.name);
            const updatedVariant = {
                ...copy[idx],
                selected: !copy[idx].selected,
            };
            editVariant(idx, updatedVariant);

            // TODO: Context change for 'variants' is not triggering a rerender, need to find a better solution.
            copy[idx].selected = !copy[idx].selected;
            setVariantsState(copy);
        }
    };

    return (
        <StyledSettingsSubMenu>
            <StyledHeader>
                <Typography variant="subtitle1" fontWeight="medium">
                    Variant Response
                </Typography>
            </StyledHeader>

            <StyledSection direction="column">
                <Typography variant="body2" color="secondary">
                    Select Variant
                </Typography>

                <Typography variant="caption" color="secondary">
                    Pinned Variants
                </Typography>
                {defaultVariant.selected && (
                    <Checkbox
                        label={`Default (Variant ${defaultVariant.name})`}
                        checked={defaultVariant.selected}
                        onChange={() =>
                            handleToggleSelected(defaultVariant, true)
                        }
                    />
                )}
                {selectedVars.map((variant, idx) => (
                    <Checkbox
                        key={`variant-${variant.name}-${idx}`}
                        label={`Variant ${variant.name}`}
                        checked={variant.selected}
                        onChange={() => handleToggleSelected(variant)}
                    />
                ))}

                <Typography variant="caption" color="secondary">
                    All Variants
                </Typography>
                {!defaultVariant.selected && (
                    <Checkbox
                        label={`Default (Variant ${defaultVariant.name})`}
                        checked={defaultVariant.selected}
                        onChange={() =>
                            handleToggleSelected(defaultVariant, true)
                        }
                    />
                )}
                {unselectedVars.map((variant, idx) => (
                    <Checkbox
                        key={`variant-${variant.name}-${idx}`}
                        label={`Variant ${variant.name}`}
                        checked={variant.selected}
                        onChange={() => handleToggleSelected(variant)}
                    />
                ))}
            </StyledSection>

            <StyledSection direction="row" gap={1}>
                <Typography variant="body2">Display Model Name</Typography>
                <Switch
                    checked={showModelsInResponse}
                    onChange={() =>
                        toggleShowModelsInResponse(!showModelsInResponse)
                    }
                />
            </StyledSection>
        </StyledSettingsSubMenu>
    );
};
