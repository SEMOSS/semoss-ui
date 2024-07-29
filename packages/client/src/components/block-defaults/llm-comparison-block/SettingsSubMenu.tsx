import {
    Stack,
    Typography,
    styled,
    Checkbox,
    Switch,
    RadioGroup,
    TextField,
    Slider,
} from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { useEffect, useState } from 'react';
import { TypeVariant } from '@/components/workspace';
import { Controller } from 'react-hook-form';
import { VariantDragAndDrop } from './VariantDragAndDrop';

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
    width: '100%',
}));

const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
    margin: 0,
}));

export const SettingsSubMenu = () => {
    const { control, getValues, setValue, watch } = useLLMComparison();
    const [selectedVars, setSelectedVars] = useState<TypeVariant[]>([]);
    const [unselectedVars, setUnselectedVars] = useState<TypeVariant[]>([]);
    const orderType = watch('orderType');
    const defaultVariant = watch('defaultVariant');
    const variants = watch('variants');

    console.log('render', orderType);

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
            setValue('defaultVariant', newDefault);
        } else {
            const copy = [...variants];
            const idx = copy.findIndex((vrnt) => variant.name === vrnt.name);
            copy[idx].selected = !copy[idx].selected;
            setValue('variants', copy);

            // TODO
            // Context change for 'variants' is not triggering a rerender, need to find a better solution.
            copy[idx].selected = !copy[idx].selected;
            setVariantsState(copy);
        }
    };

    const handleSetOrder = () => {
        // TODO
    };

    const hanldeSampleSizeChange = () => {
        // TODO
    };

    const handleTrafficChange = () => {
        // TODO
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

            <StyledSection
                direction="row"
                gap={1}
                sx={{ justifyContent: 'space-between' }}
            >
                <Typography variant="body2" color="secondary">
                    Display Model Name
                </Typography>

                <Controller
                    name="showModelsInResponse"
                    control={control}
                    render={({ field }) => (
                        <Switch
                            checked={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
            </StyledSection>

            <StyledSection direction="column" gap={1}>
                <Typography variant="body2" color="secondary">
                    Display Order
                </Typography>

                <Controller
                    name="orderType"
                    control={control}
                    render={({ field }) => (
                        <StyledRadioGroup
                            onChange={field.onChange}
                            name="orderType"
                        >
                            <RadioGroup.Item value="fixed" label="Fixed" />
                            <RadioGroup.Item value="random" label="Random" />
                            <RadioGroup.Item value="custom" label="Custom" />
                        </StyledRadioGroup>
                    )}
                />

                {orderType === 'custom' && (
                    <Stack direction="row" gap={1}>
                        <Typography variant="caption">
                            Drag items into the display order (1 = first
                            response generated).
                        </Typography>

                        <VariantDragAndDrop />
                    </Stack>
                )}
            </StyledSection>

            <StyledHeader>
                <Typography variant="subtitle1" fontWeight="medium">
                    Traffic Allocation
                </Typography>
            </StyledHeader>

            <StyledSection direction="column" gap={1}>
                <Typography variant="caption" color="secondary">
                    Sample Size
                </Typography>

                <TextField type="number" onChange={hanldeSampleSizeChange} />
            </StyledSection>

            <StyledSection direction="column" gap={1}>
                <Typography variant="caption" color="secondary">
                    Percentage of Traffic
                </Typography>

                <Stack gap={2} direction="row" alignItems="center">
                    <Slider
                        onChange={handleTrafficChange}
                        min={0}
                        max={100}
                        marks={[
                            { value: 0, label: '0' },
                            { value: 100, label: '100%' },
                        ]}
                        valueLabelDisplay="auto"
                    />

                    <TextField type="number" onChange={handleTrafficChange} />
                </Stack>
            </StyledSection>
        </StyledSettingsSubMenu>
    );
};
