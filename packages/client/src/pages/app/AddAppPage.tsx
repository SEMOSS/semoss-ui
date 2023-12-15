import { useState } from 'react';

import {
    Avatar,
    Breadcrumbs,
    Button,
    Card,
    Chip,
    Grid,
    Typography,
    styled,
} from '@semoss/ui';

import {
    AppFilter,
    ConnectEngines,
    ImportAppForm,
    ImportAppAccess,
} from '@/components/app';
import { PromptBuilder } from '@/components/prompt';

import { LoadingScreen } from '@/components/ui';

import { useNavigate } from 'react-router-dom';
import { useStepper, useRootStore, usePixel } from '@/hooks';

import { APP_STEP_INTERFACE, ADD_APP_STEPS } from './add-app.constants';
import { AppShortcut } from '@mui/icons-material';
import { BuildDb } from '@/assets/img/BuildDb';
import { AppMetadata } from '@/components/app';

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

const StyledBuilderCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{
    disabled: boolean;
}>(({ theme, disabled }) => ({
    width: '100%',
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: disabled
        ? theme.palette.secondary.light
        : theme.palette.background.paper,
}));

const StyledAppCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{
    disabled: boolean;
}>(({ theme, disabled }) => ({
    height: '300px',
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: disabled
        ? theme.palette.secondary.light
        : theme.palette.background.paper,
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
                steps[0].data.type === 'PROMPT_BUILDER' ? (
                    <PromptBuilder />
                ) : (
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
                )
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
                        <PromptBuilder />
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
        options?: AppMetadata;
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
    const myApps = usePixel<AppMetadata[]>(
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
                    {Object.entries(ADD_APP_STEPS).map(
                        (kv: [string, APP_STEP_INTERFACE]) => {
                            if (kv[0] !== 'IMPORT_APP' && !kv[1].disabled) {
                                return (
                                    <Grid
                                        item
                                        sm={12}
                                        md={4}
                                        lg={3}
                                        key={kv[0]}
                                    >
                                        <StyledBuilderCard
                                            disabled={kv[1].disabled}
                                            onClick={() => {
                                                if (!kv[1].disabled) {
                                                    const step = {
                                                        title: kv[1].title,
                                                        description:
                                                            kv[1].description,
                                                        stepInProcess: 0,
                                                        data: {
                                                            type: kv[0],
                                                        },
                                                    };

                                                    onSelect(step);
                                                }
                                            }}
                                        >
                                            <Avatar>
                                                <BuildDb />
                                            </Avatar>
                                            <Typography variant={'body1'}>
                                                {kv[1].title}
                                            </Typography>
                                        </StyledBuilderCard>
                                    </Grid>
                                );
                            }
                        },
                    )}
                </Grid>

                {/*myApps.status === 'SUCCESS' && myApps.data.length > 0 ? (
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
                                        disabled={
                                            false
                                        }
                                        onClick={() => {
                                            if (
                                                !ADD_APP_STEPS['TEMPLATE_APP']
                                                    .disabled
                                            ) {
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
                                            }
                                        }}
                                    >
                                        <Avatar>
                                            <AppShortcut />
                                        </Avatar>
                                        <Typography variant={'body1'}>
                                            {app.project_name}
                                        </Typography>
                                        {<Typography variant={'caption'}>
                                            {app.project_id}
                                        </Typography>}
                                    </StyledAppCard>
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : null */}
            </StyledContent>
        </StyledContainer>
    );
};
