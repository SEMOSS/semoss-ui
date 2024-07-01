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
    Cancel,
    ContentCopy,
    PushPinOutlined,
    PushPinRounded,
} from '@mui/icons-material';
import { TypeLlmConfig, TypeVariant } from '../../workspace/workspace.types';
import { useState } from 'react';
import { LlmCard } from './LlmCard';
import { useLLMComparison } from '@/hooks';
import { LLMSwapCard } from './LLMSwapCard';

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

const StyledVariantHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isDefault' && prop !== 'isVertical',
})<{ isDefault?: boolean; isVertical: boolean }>(
    ({ theme, isDefault, isVertical }) => ({
        backgroundColor: theme.palette.background.default,
        borderRadius: theme.spacing(1.5),
        padding: theme.spacing(2),
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),

        ...(isDefault && {
            boxShadow: '0px 5px 8px 0px #00000014',
        }),

        ...(isVertical && {
            flexDirection: 'column',
        }),
    }),
);

const StyledRow = styled('div')(({ theme }) => ({
    position: 'relative',
    height: '50px',
}));

const StyledActionBar = styled(Collapse)(({ theme }) => ({
    position: 'absolute',
    paddingTop: theme.spacing(2),
    top: theme.spacing(-2),
    width: '100%',
    zIndex: 1,
}));

interface ModelVariantProps {
    index: number;
    click?: (number) => void;

    /** is a part of the default variant used in app */
    isDefault?: boolean;

    /** variant info, the models associated to variant */
    variant: TypeVariant;

    /** sets the orientation for how the models are displayed */
    orientation?: 'column' | 'row';

    /** Props passed to each Llm Card */
    cardProps?: {
        size: 'small' | 'medium';
    };
}

export const ModelVariant = (props: ModelVariantProps) => {
    const {
        index,
        variant,
        isDefault = false,
        orientation = 'column',
        cardProps,
    } = props;
    const [hovered, setHovered] = useState(false);
    const { addNewVariant, deleteVariant, editVariant } = useLLMComparison();

    // TODO: Delete when BE is functional and no longer needed
    const buildFakeModelForTest = (num: number) => {
        return {
            alias: 'alias',
            value: `value-${num}`,
            database_name: 'database name',
            database_subtype: 'DB subType',
            database_type: 'DB type',
            icon: 'icon',
            topP: num,
            temperature: 96.7,
            length: num,
        };
    };

    const handleToggleSelected = () => {
        const updatedVariant = { ...variant };
        updatedVariant.selected = !variant.selected;
        editVariant(index, updatedVariant);
    };

    return (
        <Stack direction="column" gap={1}>
            <StyledVariantHeader>
                <Stack direction="row">
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
                            : `Variant ${variant.name}`}
                    </Typography>
                </Stack>

                {index !== -1 && (
                    <IconButton
                        color="secondary"
                        onClick={() => deleteVariant(index)}
                    >
                        <Cancel />
                    </IconButton>
                )}
            </StyledVariantHeader>

            <StyledVariantBox
                isVertical={orientation === 'column'}
                isDefault={isDefault}
            >
                {variant?.models.map((model: TypeLlmConfig, mIdx: number) => {
                    if (!model) {
                        return (
                            <LLMSwapCard
                                key={`llm-card--variant-${index}--model-${mIdx}`}
                                variantIndex={index}
                                modelIndex={mIdx}
                                size={cardProps ? cardProps.size : 'medium'}
                            />
                        );
                    } else {
                        return (
                            <LlmCard
                                key={`llm-card--variant-${index}--model-${mIdx}`}
                                llm={model}
                                variantIndex={index}
                                modelIndex={mIdx}
                                isDefault={isDefault}
                                size={cardProps ? cardProps.size : 'medium'}
                            />
                        );
                    }
                })}
            </StyledVariantBox>

            <StyledRow
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onFocus={() => setHovered(true)}
                onBlur={() => setHovered(false)}
            >
                <StyledActionBar in={isDefault || hovered}>
                    <StyledStack direction="row" gap={2}>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => {
                                addNewVariant({
                                    name: 'New Variant',
                                    selected: false,
                                    models: [
                                        buildFakeModelForTest(1),
                                        buildFakeModelForTest(2),
                                        buildFakeModelForTest(3),
                                    ],
                                });
                            }}
                            startIcon={<Add />}
                        >
                            Add Variant
                        </Button>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => addNewVariant(index)}
                            startIcon={<ContentCopy />}
                        >
                            Duplicate
                        </Button>
                    </StyledStack>
                </StyledActionBar>
            </StyledRow>
        </Stack>
    );
};
