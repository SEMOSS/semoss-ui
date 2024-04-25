import { Add, ContentCopy, DeleteOutline } from '@mui/icons-material';
import { styled, Container, Typography, Link, Stack, Button } from '@semoss/ui';
import { useState } from 'react';
import { TypeLlmConfig, TypeVariant } from './workspace.types';
import { LlmCard } from './LlmCard';

const StyledContainer = styled('section')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(4),
    paddingTop: theme.spacing(6),
}));

const StyledSectionHeader = styled(Typography)(({ theme }) => ({
    paddingBottom: theme.spacing(3),
}));

const StyledList = styled('ul')(({ theme }) => ({
    marginBottom: 0,
}));

const StyledVariant = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(2),
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    marginTop: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),

    ...(selected && {
        boxShadow: '0px 5px 8px 0px #00000014',
    }),
}));

const config1: TypeLlmConfig = {
    name: 'Dummy LLM',
    icon: 'testtesttest',
    topP: 1,
    temperature: 0.2,
    length: 2342,
};

const config2: TypeLlmConfig = {
    name: 'LLM2',
    icon: 'testtesttest',
    topP: 0.4,
    temperature: 0.9,
    length: 10003,
};

const config3: TypeLlmConfig = {
    name: 'LLM2',
    icon: 'testtesttest',
    topP: 0.3,
    temperature: 0,
    length: 993,
};

export const LlmConfigureView = () => {
    const [selectedVariant, setSelectedVariant] = useState(0);
    const [variants, setVariants] = useState<TypeVariant[]>([
        { name: 'test var', models: [config1, config2, config3] },
        { name: 'test var2', models: [config1, config2] },
    ]);

    const handleAddVariant = (idx: number) => {
        // TODO
    };

    const handleDuplicateVariant = (idx: number) => {
        // TODO
    };

    const handleDeleteVariant = (idx: number) => {
        // TODO
    };

    return (
        <Container
            maxWidth="xl"
            sx={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <StyledContainer>
                <div>
                    <StyledSectionHeader variant="h6">
                        Configure
                    </StyledSectionHeader>
                    <Typography variant="body1">
                        Select the models you want to evaluate and compare
                        simultaneously to define the most suitable model for
                        your application.
                        <StyledList>
                            <li>
                                Different models can deliver different responses
                                to the same prompt
                            </li>
                            <li>
                                Easily discern the strength and weaknesses of
                                each model
                            </li>
                            <li>
                                If you do not see a particular model, please
                                browse and request access from the{' '}
                                <Link
                                    href="../../../#!/engine/model"
                                    rel="noopener noreferrer"
                                >
                                    Model Catalog Page
                                </Link>
                            </li>
                        </StyledList>
                    </Typography>
                </div>

                {variants.map((variant: TypeVariant, idx: number) => {
                    const isSelected = selectedVariant === idx;
                    return (
                        <StyledVariant
                            key={idx}
                            onClick={() => setSelectedVariant(idx)}
                        >
                            <Typography variant="body1" fontWeight="medium">
                                {idx === 0
                                    ? `Default (${variant.name})`
                                    : variant.name}
                            </Typography>
                            <StyledVariantBox selected={isSelected}>
                                {variant.models.map(
                                    (model: TypeLlmConfig, mIdx: number) => {
                                        return (
                                            <LlmCard
                                                key={`${variant.name}-${model.name}-${mIdx}`}
                                                llm={model}
                                                isSelected={isSelected}
                                            />
                                        );
                                    },
                                )}
                            </StyledVariantBox>

                            {isSelected && (
                                <StyledStack direction="row" spacing={2}>
                                    <Button
                                        variant="text"
                                        color="secondary"
                                        onClick={() => handleAddVariant(idx)}
                                        startIcon={<Add />}
                                    >
                                        Add Variant
                                    </Button>
                                    <Button
                                        variant="text"
                                        color="secondary"
                                        onClick={() =>
                                            handleDuplicateVariant(idx)
                                        }
                                        startIcon={<ContentCopy />}
                                    >
                                        Duplicate
                                    </Button>
                                    {idx !== 0 && (
                                        <Button
                                            variant="text"
                                            color="secondary"
                                            onClick={() =>
                                                handleDeleteVariant(idx)
                                            }
                                            startIcon={<DeleteOutline />}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </StyledStack>
                            )}
                        </StyledVariant>
                    );
                })}
            </StyledContainer>
        </Container>
    );
};
