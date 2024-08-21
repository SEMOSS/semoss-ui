import {
    styled,
    Typography,
    Button,
    Stack,
    Collapse,
    IconButton,
} from '@semoss/ui';
import {
    Add,
    Close,
    ContentCopy,
    PushPinOutlined,
    PushPinRounded,
} from '@mui/icons-material';
import {
    TypeLlmConfig,
    TypeVariant,
    TypeVariants,
} from '../../workspace/workspace.types';
import { useState } from 'react';
import { LlmCard } from './LlmCard';
import { useLLMComparison } from '@/hooks';

const StyledVariantHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isVertical',
})<{ isVertical: boolean }>(({ theme, isVertical }) => ({
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),

    ...(isVertical && {
        flexDirection: 'column',
        alignItems: 'stretch',
    }),
}));

const StyledActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(1),
}));

interface ModelVariantProps {
    /** is a part of the default variant used in app */
    isDefault?: boolean;

    /** name of variant used as its ID in the 'variants' object in state */
    variantName: string;

    /** variant info, the models associated to variant */
    variant: TypeVariant;

    /** sets the orientation for how the models are displayed */
    orientation?: 'column' | 'row';
}

export const ModelVariant = (props: ModelVariantProps) => {
    const {
        variantName,
        variant,
        isDefault = false,
        orientation = 'column',
    } = props;
    const [hovered, setHovered] = useState(false);
    const { setValue, getValues } = useLLMComparison();

    const handleToggleSelected = () => {
        if (isDefault) {
            const defaultCopy = { ...getValues('defaultVariant') };
            defaultCopy.selected = !defaultCopy.selected;
            setValue('defaultVariant', defaultCopy);
        } else {
            const variantsCopy = { ...getValues('variants') };
            variantsCopy[variantName].selected = !variant.selected;
            setValue('variants', variantsCopy);
        }
    };

    const handleDeleteVariant = () => {
        const variantsCopy: TypeVariants = { ...getValues('variants') };
        const deleted = variantsCopy[variantName];
        delete variantsCopy[variantName];
        deleteVariantFromAppJson(deleted);
        setValue('variants', variantsCopy);
    };

    const deleteVariantFromAppJson = (variant: TypeVariant) => {
        // TODO: need to add action in store for deleting a variant.
    };

    const handleOpenVariantEditor = (duplicate: boolean) => {
        if (duplicate) setValue('editorVariantName', variantName);
        setValue('designerView', 'variantEdit');
    };

    return (
        <Stack
            direction="column"
            gap={1}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
            <StyledVariantHeader>
                <Stack direction="row" alignItems="center">
                    <IconButton onClick={handleToggleSelected}>
                        {variant.selected ? (
                            <PushPinRounded />
                        ) : (
                            <PushPinOutlined />
                        )}
                    </IconButton>
                    <Typography variant="body1" fontWeight="medium">
                        {isDefault
                            ? 'Default Variant'
                            : `Variant ${variantName}`}
                    </Typography>
                </Stack>

                {!isDefault && (
                    <IconButton onClick={handleDeleteVariant}>
                        <Close />
                    </IconButton>
                )}
            </StyledVariantHeader>

            <StyledVariantBox isVertical={orientation === 'column'}>
                {variant?.models.map((model: TypeLlmConfig, mIdx: number) => (
                    <LlmCard
                        key={`llm-card--model-${mIdx}`}
                        llm={model}
                        variantName={variantName}
                        modelIndex={mIdx}
                        isDefault={isDefault}
                        isVariantHovered={hovered}
                    />
                ))}
            </StyledVariantBox>

            <Collapse in={hovered}>
                <StyledActionBar>
                    <Button
                        variant="text"
                        color="secondary"
                        onClick={() => handleOpenVariantEditor(false)}
                        startIcon={<Add />}
                    >
                        Add Variant
                    </Button>
                    <Button
                        variant="text"
                        color="secondary"
                        onClick={() => handleOpenVariantEditor(true)}
                        startIcon={<ContentCopy />}
                    >
                        Duplicate
                    </Button>
                </StyledActionBar>
            </Collapse>
        </Stack>
    );
};
