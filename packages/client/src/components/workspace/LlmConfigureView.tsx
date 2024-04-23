import { styled, Container, Typography, Link } from '@semoss/ui';
import { useState } from 'react';

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

const StyledModelContainer = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(4),
}));

interface modelVariant {
    llms: llmConfig[];
}

interface llmConfig {
    name: string;
    topP: number;
    temperature: number;
    length: number;
}

const defaultLlmConfig: llmConfig = {
    name: 'Dummy Data',
    topP: 0,
    temperature: 0,
    length: 0,
};

export const LlmConfigureView = () => {
    const [application, setApplication] = useState<string>('');
    const [applicationOptions, setApplicationOptions] = useState<string[]>([]);
    const [defaultModel, setDefaultModel] =
        useState<llmConfig>(defaultLlmConfig);
    const [variants, setVariants] = useState<modelVariant[]>([]);

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
                        simultaneously tp define the most suitable model for
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

                <StyledModelContainer>
                    <Typography variant="body1" fontWeight="medium">
                        Default ({defaultModel.name})
                    </Typography>
                </StyledModelContainer>
            </StyledContainer>
        </Container>
    );
};
