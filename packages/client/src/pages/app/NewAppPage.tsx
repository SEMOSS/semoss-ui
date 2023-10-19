import React from 'react';
import { Card, Button, Stack, Typography, styled } from '@semoss/ui';
import { Page } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

import { useImport } from '@/hooks';

import { ImportAppPage } from './ImportAppPage';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '300px',
    width: '300px',
    backgroundColor: theme.palette.secondary.light,
    padding: theme.spacing(1),
    // paddingLeft: theme.spacing(0.5),
    // zIndex: 9998,
}));

export const NewAppPage = () => {
    const navigate = useNavigate();
    const { steps, setSteps, setActiveStep, activeStep } = useImport();

    return (
        <Page
            header={
                <Stack>
                    <div>Breadcrumb</div>
                    <Typography variant="h4">
                        {!steps.length ? 'Add App' : activeStep.title}
                    </Typography>
                    <Typography variant="body1">
                        {!steps.length
                            ? 'Select a template, import an existing app, or create a new app'
                            : activeStep.description}
                    </Typography>
                </Stack>
            }
        >
            {/* Landing Page */}
            {steps.length === 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="h5">App Templates</Typography>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                const step = {
                                    title: 'Build App',
                                    description: 'Build App with framework',
                                    data: 'Framework build',
                                };

                                setActiveStep(0);
                                setSteps([step], 0);
                                // navigate('/app/framework-build');
                            }}
                        >
                            Create Default App
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                const step = {
                                    title: 'Import App',
                                    description: 'Create app with UI Builder',
                                    data: 'import',
                                };

                                setActiveStep(0);
                                setSteps([step], 0);
                                // navigate('/app/import');
                            }}
                        >
                            Import App
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* Landing content of page: How to create app*/}
            {!steps.length ? (
                <div>
                    <StyledCard
                        onClick={() => {
                            console.log(
                                'Just create App with an empty zip, and then redirect to /app/39369823',
                            );
                        }}
                    >
                        Blank Template
                    </StyledCard>
                    <StyledCard
                        onClick={() => {
                            const step = {
                                title: 'Prompt Builder',
                                description: 'Create app with prompt builder',
                                data: 'Prompt builder',
                            };

                            setActiveStep(0);
                            setSteps([step], 0);
                        }}
                    >
                        Prompt Builder
                    </StyledCard>
                    <StyledCard
                        onClick={() => {
                            const step = {
                                title: 'UI Builder',
                                description: 'Create app with UI Builder',
                                data: 'Ui Builder',
                            };

                            setActiveStep(0);
                            setSteps([step], 0);
                        }}
                    >
                        Ui Builder
                    </StyledCard>
                </div>
            ) : null}

            {/* Step 1 - Create App via whatever process, with meta data like name and such */}
            {steps.length === 1 && steps[0].title === 'UI Builder' ? (
                <div> UI Builder Component</div>
            ) : null}

            {steps.length === 1 && steps[0].title === 'Prompt Builder' ? (
                <div> Prompt Builder Component</div>
            ) : null}

            {steps.length === 1 && steps[0].title === 'Import App' ? (
                <ImportAppPage />
            ) : null}

            {steps.length === 1 && steps[0].title === 'Build App' ? (
                <ImportAppPage /> // Can be shared really just creates App
            ) : null}

            {steps.length === 1 && steps[0].title === 'Template App' ? (
                <ImportAppPage /> // Can be shared really just creates App
            ) : null}
            {/* End of Step 1: ----------------------- */}

            {/* Step 2:  App has been created, privacy and other details*/}
            {/* Framework Build App has an extra step for connecting Engines */}

            {/* Next step in process is members and privacy: for everything in framework build App. */}

            {/* Step 3: */}
            {/* Only Build App from Framework, get members*/}
        </Page>
    );
};
