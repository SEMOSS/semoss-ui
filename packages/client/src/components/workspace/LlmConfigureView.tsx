import { styled, Container, Typography, Select, Link, List } from '@semoss/ui';
import { useState } from 'react';

const StyledContainer = styled('div')(({ theme }) => ({
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

const StyledSelect = styled(Select)(({ theme }) => ({
    width: '488px',
    marginTop: theme.spacing(2),
}));

const StyledList = styled('ul')(({ theme }) => ({
    marginBottom: 0,
}));

export const LlmConfigureView = () => {
    const [application, setApplication] = useState<string>('');
    const [applicationOptions, setApplicationOptions] = useState<string[]>([]);

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
                <section>
                    <StyledSectionHeader variant="h6">
                        Application
                    </StyledSectionHeader>
                    <Typography variant="body1">
                        Select an application to compare responses from multiple
                        large language models
                    </Typography>
                    <StyledSelect
                        label="Select an application"
                        value={application}
                    >
                        {applicationOptions.map((app: string, idx: number) => {
                            return (
                                <Select.Item
                                    key={`app-${app}-${idx}`}
                                    value={app}
                                >
                                    {app}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </section>

                <section>
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
                                    href="TODO: Need to figure out the URL"
                                    rel="noopener noreferrer"
                                >
                                    Model Catalog Page
                                </Link>
                            </li>
                        </StyledList>
                    </Typography>
                </section>

                <section>
                    <StyledSectionHeader variant="body1" fontWeight="medium">
                        Default
                    </StyledSectionHeader>
                </section>
            </StyledContainer>
        </Container>
    );
};
