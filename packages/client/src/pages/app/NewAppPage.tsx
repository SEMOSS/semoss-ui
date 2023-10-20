import React from 'react';
import {
    Breadcrumbs,
    Button,
    Card,
    Stack,
    Typography,
    styled,
} from '@semoss/ui';
import { Page } from '@/components/ui';
import { Link, useNavigate } from 'react-router-dom';

import { useImport } from '@/hooks';

import { ImportAppPage } from './ImportAppPage';

const StyledLink = styled(Link)(() => ({
    textDecoration: 'none',
    color: 'inherit',
}));

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
                    <Breadcrumbs>
                        <StyledLink to={`..`}>App Library</StyledLink>
                        <StyledLink to={`.`}>Add App</StyledLink>
                    </Breadcrumbs>
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
                                    data: {
                                        type: 'template',
                                        title: 'Framework build',
                                    },
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
                                    data: {
                                        type: 'template',
                                        title: 'Import',
                                    },
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
                            const step = {
                                title: 'Blank Template',
                                description: 'Create app with prompt builder',
                                data: {
                                    type: 'template',
                                    title: 'Blank Template',
                                },
                            };

                            setActiveStep(0);
                            setSteps([step], 0);

                            // console.log(
                            //     'Just create App with an empty zip, and then redirect to /app/39369823',
                            // );
                        }}
                    >
                        Blank Template
                    </StyledCard>
                    <StyledCard
                        onClick={() => {
                            const step = {
                                title: 'Prompt Builder',
                                description: 'Create app with prompt builder',
                                data: {
                                    type: 'Prompt',
                                    title: 'Prompt builder',
                                },
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
                                data: {
                                    type: 'UI-Builder',
                                    title: 'UI Builder',
                                },
                            };

                            setActiveStep(0);
                            setSteps([step], 0);
                        }}
                    >
                        UI Builder
                    </StyledCard>

                    <StyledCard
                        onClick={() => {
                            const step = {
                                title: 'Template App',
                                description: 'Create app with template',
                                data: {
                                    type: 'Template App',
                                    title: 'Template App',
                                    options: 'placeholder id: 8913971',
                                },
                            };

                            setActiveStep(0);
                            setSteps([step], 0);
                        }}
                    >
                        Placeholder Template
                    </StyledCard>
                </div>
            ) : null}

            {/* Step 1 - Create App via whatever process, with meta data like name and such */}
            {steps.length === 1 ? (
                <ImportAppPage
                    onCreate={(appId) => {
                        console.log(
                            'Set step for created app and move to permissions or for framework app get engines to have access to in app',
                        );
                    }}
                    data={{
                        type: steps[0].title,
                        options: steps[0].data.options,
                    }}
                />
            ) : null}
            {/* End of Step 1: ----------------------- */}

            {/* Step 2:  App has been created, privacy and other details*/}
            {/* 1. Framework Build App has an extra step for connecting Engines */}

            {/* 2. Next step in process is members and privacy: for everything in framework build App. */}

            {/* Step 3: */}
            {/* Only Build App from Framework, get members */}
            {/* Or */}
            {/* Take them to the editor, ui builder or prompt builder */}
        </Page>
    );
};

// {steps.length === 1 && steps[0].title === 'UI Builder' ? (
//     <div> UI Builder Component</div>
// ) : null}

// {steps.length === 1 && steps[0].title === 'Prompt Builder' ? (
//     <div> Prompt Builder Component</div>
// ) : null}

// {steps.length === 1 && steps[0].title === 'Build App' ? (
//     <ImportAppPage
//         onCreate={(appId) => {
//             console.log(
//                 'Set Step for created app and move to permissions',
//             );
//         }}
//     /> // Can be shared really just creates App
// ) : null}

// {steps.length === 1 && steps[0].title === 'Template App' ? (
//     <ImportAppPage
//         onCreate={(appId) => {
//             console.log(
//                 'Set Step for created app and move to permissions',
//             );
//         }}
//     /> // Can be shared really just creates App
// ) : null}

// {steps.length === 1 && steps[0].title === 'Blank Template' ? (
//     <ImportAppPage /> // Can be shared really just creates App
// ) : null}
