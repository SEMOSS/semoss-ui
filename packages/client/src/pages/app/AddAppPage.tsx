import React, { useState } from 'react';
import { ArrowBack } from '@mui/icons-material';

import {
    Avatar,
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

import {
    App,
    AppFilter,
    ConnectEngines,
    ImportAppForm,
    ImportAppAccess,
} from '@/components/app';
import { PromptGenerator } from '@/components/prompt';

import { Page, LoadingScreen } from '@/components/ui';

import { Link, useNavigate } from 'react-router-dom';
import { useStepper, useRootStore, usePixel } from '@/hooks';

import { ADD_APP_STEPS } from './add-app.constants';
import { BuildDb } from '@/assets/img/BuildDb';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledSpaceBetween = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const StyledGap = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: theme.spacing(3),
    flex: '1',
}));

const StyledBuilderCard = styled(Card)(({ theme }) => ({
    // height: '300px',
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const StyledAppCard = styled(Card)(({ theme }) => ({
    height: '300px',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const AddAppPage = () => {
    const navigate = useNavigate();
    const { steps, setSteps, setActiveStep, activeStep } = useStepper();
    const [appId, setAppId] = useState('');

    return (
        <div>
            {/* Add App Header OR Stepper based on selected import */}
            {steps.length === 0 ? (
                <StyledSpaceBetween>
                    <Typography variant="h5">App Templates</Typography>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="contained"
                            onClick={() => {
                                const step = {
                                    title: 'Import App',
                                    description:
                                        'Easily import your app with the flexibility of choosing between a seamless ZIP file upload or direct Git repository integration. Effortlessly bring your codebase into our platform, streamlining the onboarding process for efficient collaboration and development',
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
                </StyledSpaceBetween>
            ) : (
                <StyledGap>
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
                </StyledGap>
            )}

            {/* Landing content of page: How to create app*/}
            {!steps.length ? (
                <AddAppSelectionPage
                    onSelect={(step) => {
                        setActiveStep(0);
                        setSteps([step], 0);
                    }}
                />
            ) : null}

            {/* Step 1 */}
            {/* All Import Workflows: Get Metadata, and import type specific properties */}
            {steps.length === 1 ? (
                <ImportAppForm
                    data={steps[0].data}
                    onCreate={(appId) => {
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

            {/* Step 2:  App has been created and we now have an App Id */}
            {/* 1. Framework App: Connecting Engines */}
            {/* 2. Everything Else: App Access */}
            {steps.length === 2 ? (
                <div>
                    {steps[0].data.type === 'FRAMEWORK_APP' ? (
                        <ConnectEngines
                            appId={appId}
                            onSuccess={() => {
                                // Set new step in process
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
                            }}
                        />
                    ) : (
                        <ImportAppAccess
                            appId={appId}
                            onSuccess={() => {
                                const APP_TYPE = steps[0].data.type;
                                // Just Navigate to the App Page
                                if (APP_TYPE !== 'PROMPT_BUILDER') {
                                    // ID of APP
                                    navigate(`../${steps[1].data.options}`);
                                } else {
                                    // Set new step in process
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

                                    setSteps(
                                        [...steps, accessStep],
                                        steps.length,
                                    );
                                }
                            }}
                        />
                    )}
                </div>
            ) : null}

            {/* Step 3 */}
            {/* 1. Framework App: App Access */}
            {/* 2. Prompt Generator: Build Prompt */}
            {steps.length === 3 ? (
                <>
                    {steps[0].data.type === 'PROMPT_BUILDER' ? (
                        <PromptGenerator
                            onSuccess={() => {
                                console.warn('navigate to app page');
                            }}
                        />
                    ) : (
                        <ImportAppAccess
                            appId={appId}
                            onSuccess={() => {
                                navigate(`../${steps[1].data.options}`);
                            }}
                        />
                    )}
                </>
            ) : null}
        </div>
    );
};

interface SelectionStep {
    title: string;
    description: string;
    stepInProcess: number;
    data: {
        type: string;
        options?: App;
    };
}
interface AddAppSelectionPageProps {
    /**
     * Sends baseline info based on selection to the parent
     */
    onSelect: (step: SelectionStep) => void;
}

/**
 * TODO: Discuss with Neel, how can we generecize this to be used on Landing Page
 * OR Do we keep it seperate??
 */
export const AddAppSelectionPage = (props: AddAppSelectionPageProps) => {
    const { onSelect } = props;
    const { configStore } = useRootStore();

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

    if (myApps.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Retrieving app templates" />;
    }

    return (
        <StyledContainer>
            <AppFilter
                onChange={(filters) => {
                    console.log('filter my apps pixel call');
                }}
            />
            <StyledContent>
                <Grid container columnSpacing={3} rowSpacing={3}>
                    <Grid item sm={12} md={4} lg={3} xl={3}>
                        <StyledBuilderCard
                            onClick={() => {
                                const step = {
                                    title: 'Prompt Builder',
                                    description:
                                        'Empower your web design journey with our innovative UI Builder, responding to the prompt to create visually stunning websites effortlessly.  This intuitive platform allows you to design pixel-perfect layouts, customize interactions, and bring ideas to life seamlessly, all while freeing you from code constraints',
                                    stepInProcess: 0,
                                    data: {
                                        type: 'PROMPT_BUILDER',
                                    },
                                };

                                onSelect(step);
                            }}
                        >
                            <Avatar>
                                <BuildDb />
                            </Avatar>
                            <Typography variant={'body1'}>
                                Prompt Builder
                            </Typography>
                        </StyledBuilderCard>
                    </Grid>
                    <Grid item sm={12} md={4} lg={3} xl={3}>
                        <StyledBuilderCard
                            onClick={() => {
                                const step = {
                                    title: 'UI Builder',
                                    description:
                                        'Craft visually stunning websites effortlessly with our UI Builder. Design pixel-perfect layouts, customize interactions, and bring ideas to life seamlessly, empowering you to create without code constraints.',
                                    stepInProcess: 0,
                                    data: {
                                        type: 'UI_BUILDER',
                                    },
                                };
                                onSelect(step);
                            }}
                        >
                            <Avatar>
                                <BuildDb />
                            </Avatar>
                            <Typography variant={'body1'}>
                                UI Builder
                            </Typography>
                        </StyledBuilderCard>
                    </Grid>
                    <Grid item sm={12} md={4} lg={3} xl={3}>
                        <StyledBuilderCard
                            onClick={() => {
                                const step = {
                                    title: 'Build App',
                                    description:
                                        'Define purpose, research market, design UI/UX, choose front-end framework (React, AngularJs, Vue), develop responsive UI components, integrate APIs, test rigorously, ensure security, deploy, monitor, gather feedback, iterate, and launch for a dynamic and visually engaging app.',
                                    stepInProcess: 0,
                                    data: {
                                        type: 'FRAMEWORK_APP',
                                    },
                                };

                                onSelect(step);
                            }}
                        >
                            <Avatar>
                                <BuildDb />
                            </Avatar>
                            <Typography variant={'body1'}>
                                Build with Framework
                            </Typography>
                        </StyledBuilderCard>
                    </Grid>
                    <Grid item sm={12} md={4} lg={3} xl={3}>
                        <StyledBuilderCard
                            onClick={() => {
                                const step = {
                                    title: 'Build from scratch',
                                    description:
                                        'Define purpose, research market, design UI/UX, choose tech stack, develop frontend/backend, integrate APIs, test rigorously, ensure security, deploy, monitor, gather feedback, iterate, and launch for a successful app.',
                                    stepInProcess: 0,
                                    data: {
                                        type: 'TEMPLATE_APP',
                                        // options: '',
                                    },
                                };
                                onSelect(step);
                            }}
                        >
                            <Avatar>
                                <BuildDb />
                            </Avatar>
                            <Typography variant={'body1'}>
                                Start App From Scratch
                            </Typography>
                        </StyledBuilderCard>
                    </Grid>
                </Grid>

                {myApps.status === 'SUCCESS' && myApps.data.length > 0 ? (
                    <Grid container columnSpacing={3} rowSpacing={3}>
                        {myApps.data.map((app) => {
                            return (
                                <Grid
                                    item
                                    key={app.project_id}
                                    sm={12}
                                    md={4}
                                    lg={3}
                                    xl={3}
                                >
                                    <StyledAppCard
                                        onClick={() => {
                                            const step = {
                                                title: 'Template App',
                                                description:
                                                    'Create app with template',
                                                stepInProcess: 0,
                                                data: {
                                                    type: 'TEMPLATE_APP',
                                                    options: app,
                                                },
                                            };
                                            onSelect(step);
                                        }}
                                    >
                                        <Typography variant={'body1'}>
                                            {app.project_name}
                                        </Typography>
                                        <Typography variant={'caption'}>
                                            {app.project_id}
                                        </Typography>
                                    </StyledAppCard>
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : null}
            </StyledContent>
        </StyledContainer>
    );
};
