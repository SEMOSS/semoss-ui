import React, { useState } from 'react';
import { ArrowBack } from '@mui/icons-material';

import {
    Breadcrumbs,
    Button,
    Card,
    Chip,
    Grid,
    Icon,
    Stack,
    Typography,
    styled,
} from '@semoss/ui';

import { Page } from '@/components/ui';
import { ImportApp, App } from '@/components/app';
import { MembersTable, SettingsTiles } from '@/components/settings';

import { Link, useNavigate } from 'react-router-dom';
import { useImport, useRootStore, usePixel } from '@/hooks';
import { SettingsContext } from '@/contexts';

import { ADD_APP_STEPS } from './add-app.constants';
import { ImportStep } from '@/contexts/ImportContext';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledFilter = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    width: '355px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
}));

const StyledContent = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1',
}));

const StyledLink = styled(Link)(({ theme }) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const StyledCard = styled(Card)(({ theme }) => ({
    height: '300px',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    // paddingLeft: theme.spacing(0.5),
    // zIndex: 9998,
}));

export const NewAppPage = () => {
    const navigate = useNavigate();
    const { steps, setSteps, setActiveStep, activeStep } = useImport();
    const { configStore } = useRootStore();

    const [appId, setAppId] = useState('');

    // get a list of the keys
    const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead' ||
                k.display_options === 'textarea'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = projectMetaKeys.map((k) => {
        return k.metakey;
    });

    // get the projects
    const myApps = usePixel<App[]>(
        `MyProjects(metaKeys = ${JSON.stringify(
            metaKeys,
        )}, onlyPortals=[true]);`,
    );

    return (
        <Page
            header={
                <Stack>
                    <Breadcrumbs>
                        {!steps.length ? (
                            <StyledLink to={`..`}>App Library</StyledLink>
                        ) : null}
                        <StyledLink
                            to={`.`}
                            onClick={() => {
                                setSteps([], -1);
                            }}
                        >
                            {steps.length ? (
                                <Icon>
                                    <ArrowBack />
                                </Icon>
                            ) : null}
                            Add App
                        </StyledLink>
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
            {/* Add App Header OR Stepper based on selected import */}
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
                                    stepInProcess: 0,
                                    data: {
                                        type: 'FRAMEWORK_APP',
                                    },
                                };

                                setActiveStep(0);
                                setSteps([step], 0);
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
                                    stepInProcess: 0,
                                    data: {
                                        type: 'IMPORT_APP',
                                    },
                                };

                                setActiveStep(0);
                                setSteps([step], 0);
                            }}
                        >
                            Import App
                        </Button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Breadcrumbs>
                        {ADD_APP_STEPS[steps[0].data.type].steps.map(
                            (step, i) => {
                                const s = activeStep as unknown as {
                                    stepInProcess: number;
                                };
                                // Not Ideal -> Loop through steps and see if that precursor step is complete, in order to disable
                                return (
                                    <Chip
                                        key={i}
                                        label={step.title}
                                        variant={'outlined'}
                                        disabled={i > s.stepInProcess}
                                        color={
                                            i === s.stepInProcess
                                                ? 'primary'
                                                : 'default'
                                        }
                                        onClick={() => {
                                            if (s.stepInProcess > i - 1) {
                                                console.log('navigate to step');
                                            }
                                        }}
                                    />
                                );
                            },
                        )}
                    </Breadcrumbs>
                </div>
            )}

            {/* Landing content of page: How to create app*/}
            {!steps.length ? (
                <StyledContainer>
                    <StyledFilter>Filter Box</StyledFilter>
                    <StyledContent>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <StyledCard
                                onClick={() => {
                                    const step = {
                                        title: 'Prompt Builder',
                                        description:
                                            'Create app with prompt builder',
                                        stepInProcess: 0,
                                        data: {
                                            type: 'PROMPT_BUILDER',
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
                                        description:
                                            'Create app with UI Builder',
                                        stepInProcess: 0,
                                        data: {
                                            type: 'UI_BUILDER',
                                        },
                                    };

                                    setActiveStep(0);
                                    setSteps([step], 0);
                                }}
                            >
                                UI Builder
                            </StyledCard>
                        </div>

                        {myApps.status === 'SUCCESS' &&
                        myApps.data.length > 0 ? (
                            <Grid container columnSpacing={3} rowSpacing={3}>
                                <Grid item sm={12} md={6} lg={4} xl={4}>
                                    <StyledCard
                                        onClick={() => {
                                            const step = {
                                                title: 'Blank Template',
                                                description:
                                                    'Create app with prompt builder',
                                                stepInProcess: 0,
                                                data: {
                                                    type: 'TEMPLATE_APP',
                                                    options: '',
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
                                </Grid>
                                {myApps.data.map((app) => {
                                    return (
                                        <Grid
                                            item
                                            key={app.project_id}
                                            sm={12}
                                            md={4}
                                            lg={3}
                                            xl={2}
                                        >
                                            <StyledCard
                                                onClick={() => {
                                                    const step = {
                                                        title: 'Template App',
                                                        description:
                                                            'Create app with template',
                                                        stepInProcess: 0,
                                                        data: {
                                                            type: 'TEMPLATE_APP',
                                                            options:
                                                                app.project_id,
                                                        },
                                                    };

                                                    setActiveStep(0);
                                                    setSteps([step], 0);
                                                }}
                                            >
                                                {app.project_id}
                                            </StyledCard>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ) : null}
                    </StyledContent>
                </StyledContainer>
            ) : null}

            {/* Step 1 - Create App via whatever process, with meta data like name and such */}
            {steps.length === 1 ? (
                <ImportApp
                    data={steps[0].data}
                    onCreate={(appId) => {
                        console.log(
                            'Set step for created app and move to permissions or for framework app get engines to have access to in app',
                        );

                        setAppId(appId);

                        const stepWithAppId = {
                            title: 'Access',
                            description:
                                'Retrieve Access Permissions for newly added app',
                            stepInProcess: 1,
                            data: {
                                type: 'Import App',
                                title: 'Import App',
                                options: appId,
                            },
                        };

                        setSteps([...steps, stepWithAppId], steps.length);
                    }}
                />
            ) : null}
            {/* End of Step 1: ----------------------- */}

            {/* Step 2:  App has been created, Navigate to Settings page*/}
            {/* 1. Framework Build App has an extra step for connecting Engines */}
            {/* 2. Next step in process is members and privacy: for everything in framework build App. */}

            {steps.length === 2 ? (
                <div>
                    {steps[0].data.type === 'FRAMEWORK_APP' ? (
                        <div>Connect Engines</div>
                    ) : (
                        <SettingsContext.Provider
                            value={{
                                adminMode: configStore.store.user.admin,
                            }}
                        >
                            <SettingsTiles
                                mode="app"
                                name={'App'}
                                id={appId}
                                // onDelete={() => {
                                //     navigate('/catalog');
                                // }}
                            />
                            <MembersTable
                                id={appId}
                                mode={'app'}
                                name={'app'}
                            />
                        </SettingsContext.Provider>
                    )}

                    <Button
                        onClick={() => {
                            const APP_TYPE = steps[0].data.type;
                            // Set new step in process

                            // Just Navigate to the App Page
                            if (
                                APP_TYPE !== 'PROMPT_BUILDER' &&
                                APP_TYPE !== 'FRAMEWORK_APP'
                            ) {
                                navigate(`../${steps[1].data.options}`);
                            } else {
                                const accessStep = {
                                    title: steps[0].title,
                                    description: steps[0].description,
                                    stepInProcess: 2,
                                    data: {
                                        type: steps[0].data.type,
                                        options:
                                            'Successfully added permissions',
                                    },
                                };

                                setSteps([...steps, accessStep], steps.length);
                            }
                        }}
                    >
                        Next
                    </Button>
                </div>
            ) : null}

            {/* Step 3: */}
            {/* Only Build App from Framework, get members */}
            {/* Or */}
            {/* Take them to the editor, ui builder or prompt builder */}

            {/* 
            <PromptGenerator
                onComplete={() => {
                    navigate()
                }}
            /> 
            */}
            {steps.length === 3 ? (
                <>
                    {steps[0].data.type === 'PROMPT_BUILDER' ? (
                        <div>Prompt Builder</div>
                    ) : (
                        <div>Framework Members</div>
                    )}
                </>
            ) : null}
        </Page>
    );
};
