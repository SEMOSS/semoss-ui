import { styled, Container, Typography, Link } from '@semoss/ui';
import { useState } from 'react';
import { TypeLlmConfig, TypeVariant } from './workspace.types';
import { ModelVariant } from './ModelVariant';

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
                        <ModelVariant
                            key={`variant-${idx}`}
                            isSelected={isSelected}
                            variant={variant}
                            index={idx}
                            click={() => setSelectedVariant(idx)}
                        />
                    );
                })}
            </StyledContainer>
        </Container>
    );
};
