import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import {
    Stack,
    Typography,
    Accordion,
    IconButton,
    Switch,
    styled,
} from '@semoss/ui';
import { useConductor } from '@/hooks';
import {
    Visibility,
    Person,
    KeyboardArrowDown,
    Create,
    DataObject,
    DisplaySettings,
    ChevronLeft,
    ChevronRight,
    OpenInNewRounded,
    ArrowRightAlt,
    ReportProblem,
} from '@mui/icons-material';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';

import { Grid, Select, MenuItem } from '@mui/material';

import Carousel from './Carousel';
import TaskStepper from './TaskStepper';

import Button from '@mui/material/Button';

const GridBreak = styled('div')(({ theme }) => ({
    width: '100%',
}));

const AppSelectionCard = styled(Box)(({ theme }) => ({
    borderRadius: '10px',
    boxShadow: '-2px 2px 12px #00000010',
    width: '421px',
    height: '184px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    padding: '16px',
}));

interface NewConductorStepProps {
    step: unknown | SerializedState;
    type: 'app' | 'widget';
    taskIndex: number;
    selectedSubtask: number;
    setSelectedSubtask: Function;
    taskEditorHistory: Array<number>;
    setTaskEditorHistory: Function;
    openAccordionIndexesSet: Set<number | unknown>;
    setOpenAccordionIndexesSet: Function;
    subtask: string;
}

const DUMMY_SUBTASK_INPUTS = [
    'Income_monthly',
    'Loan total',
    'Term of loan',
    'Interest of loan',
    'Property tax rate',
    'HOA dues',
    'Current assets',
];

const DUMMY_INPUT_TYPES = [
    'integer',
    'float',
    'string',
    'json',
    'boolean',
    'image',
    'pdf',
    'mp3',
];

export const NewConductorStep = observer(
    ({
        step,
        type,
        taskIndex,
        selectedSubtask,
        setSelectedSubtask,
        taskEditorHistory,
        setTaskEditorHistory,
        openAccordionIndexesSet,
        setOpenAccordionIndexesSet,
        subtask,
    }: NewConductorStepProps) => {
        const { conductor } = useConductor();
        /**
         * Set input pool values on mount
         */
        useEffect(() => {
            Object.entries(step['variables']).forEach((variable) => {
                const name = variable[0];
                const value = variable[1];
                if (value['isInput'] || value['isOutput']) {
                    let v = '';
                    if (value['type'] === 'block') {
                        v = step['blocks'][value['to']].data.value;
                    } else {
                        v = 'get the value from blocks';
                    }
                    conductor.setInputValue(name, v);
                }
            });
        }, [Object.keys(step).length, type]);

        const [isExpanded, setHistoryExpanded] = useState(false);
        const [isRawInputsShown, setIsRawInputsShown] = useState(false);
        const [selectedSubTaskApp, setSelectedSubTaskApp] = useState(null);

        const [activeStep, setActiveStep] = React.useState(0);
        const [skipped, setSkipped] = React.useState(new Set<number>());
        const [stepsComplete, setStepsComplete] = React.useState(false);

        const [isAppSetupComplete, setIsAppSetupComplete] = useState(false);

        const [taskSteps, setTaskSteps] = React.useState([
            'Select app',
            'View App',
            'Map inputs and outputs',
            'Complete subtask',
        ]);

        const DUMMY_IMG_URLS = [
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.7KXbdcsH9BKcYhKmd8hymAHaEu%26pid%3DApi&f=1&ipt=3d3e9d8d20653b1232ac8f02920cfca90faff98e890696f3aa1f8363e64d9758&ipo=images',
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.xZy01t2g2X1yYA_GaCG7zQHaEL%26pid%3DApi&f=1&ipt=4bcfaf8c5bc4cc81c0df01e8c64d3db931a8a175baba0ea482474eb4cf2dc276&ipo=images',
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.o2gUxcNq5s8XpL1ZCN1d7gHaEW%26pid%3DApi&f=1&ipt=cd449bd389cc236b416fa915f567c24716768121f7dbe498c91275d2aade738c&ipo=images',
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.GPWfdZcgDsEdGO_h3wZfygHaFD%26pid%3DApi&f=1&ipt=198c4edbbf968962bdb89b86dbf630725e4c7e35fcd1e993a4efda839cbd8d0a&ipo=images',
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%3Fid%3DOIP.nc9yQep6dCqorW8O9CETjwHaFj%26pid%3DApi&f=1&ipt=4f7940e69169da6fe34e6a30e7b1b49539bf3e9c5a3a20587c8207afd0933403&ipo=images',
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.DWSTJ5nRA1Df7GUIHLZbPQHaEF%26pid%3DApi&f=1&ipt=5e6db97bff396353bd9fa24a92a7f793f5eaec4cc6f4d02bdf0d46caf388a9ad&ipo=images',
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.HPFWeJ5oWgJyn5N7uZj4-wHaEK%26pid%3DApi&f=1&ipt=ce2c2b73e484f9261692f67485349bda5ae1d1dcc884925b916c396f23676d7d&ipo=images',
        ];

        const [appCarouselOffset, setAppCarouselOffset] = useState(0);
        const [appOptions, setAppOptions] = React.useState([
            {
                title: 'Purchase Budget Calculator',
                description:
                    'Effortlessly plan and manage spending by providing precise budget calculations and receiving insightful financial analysis.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Home Affordability Calculator',
                description:
                    'Determines your ideal home price range by analyzing your financial situation and providing personalized affordability insights.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Zillow Lookup',
                description:
                    'Quickly and easily access comprehensive property details, market trends, and real estate insights directly from Zillow.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Job Qualifications',
                description:
                    'Analyzes a job description and extracts required qualifications.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Job Skill Matcher',
                description:
                    'Takes a list of skills and matches them to relevant job titles.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Job Salary Data',
                description:
                    'Receives a job title and provides average salary data.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Resume Key Skills',
                description: 'Analyzes a resume and extracts key skills.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Job Responsibilities',
                description:
                    'Receives a job title and lists common job responsibilities.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
            {
                title: 'Performance Indicators',
                description:
                    'Takes a job description and identifies key performance indicators.',
                imgUrl: '',
                appId: Math.floor(Math.random() * 1000000000),
            },
        ]);

        const isStepSkipped = (step: number) => {
            return skipped.has(step);
        };

        const handleNext = () => {
            let newSkipped = skipped;
            if (isStepSkipped(activeStep)) {
                newSkipped = new Set(newSkipped.values());
                newSkipped.delete(activeStep);
            }

            if (activeStep === taskSteps.length - 1) {
                setStepsComplete(true);
            }

            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            setSkipped(newSkipped);
        };

        const handleBack = () => {
            setActiveStep((prevActiveStep) => prevActiveStep - 1);
        };

        const handleReset = () => {
            setActiveStep(0);
            setStepsComplete(false);
        };

        useEffect(() => {
            if (activeStep == 0) {
                setSelectedSubTaskApp(null);
            }
        }, [activeStep]);

        return (
            <Accordion
                expanded={isExpanded}
                onChange={(e) => {
                    setHistoryExpanded(!isExpanded);
                }}
                sx={{
                    paddingTop: '0px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                }}
            >
                <Accordion.Trigger expandIcon={<KeyboardArrowDown />}>
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignContent: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '0px',
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                height: '42px',
                                lineHeight: '42px',
                                // fontWeight: '800',
                            }}
                        >
                            <b>Subtask {taskIndex + 1}</b> {subtask}
                        </Typography>
                        <IconButton
                            onClick={(e) => {
                                setSelectedSubtask(taskIndex);
                                e.stopPropagation();
                            }}
                            disabled={!stepsComplete}
                        >
                            <DataObject />
                        </IconButton>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content sx={isExpanded ? {} : { display: 'none' }}>
                    <Stack
                        direction="column"
                        sx={{
                            backgroundColor: '#fff',
                            padding: '16px',
                            borderRadius: '12px',
                            paddingTop: '0px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'left',
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                            }}
                        >
                            {!stepsComplete && (
                                <Stepper
                                    activeStep={activeStep}
                                    sx={{ width: '80%' }}
                                >
                                    <Step>
                                        <StepLabel>Select app</StepLabel>
                                    </Step>
                                    <Step>
                                        <StepLabel>View App</StepLabel>
                                    </Step>
                                    <Step>
                                        <StepLabel>
                                            Map inputs and outputs
                                        </StepLabel>
                                    </Step>
                                    <Step>
                                        <StepLabel>Complete subtask</StepLabel>
                                    </Step>
                                </Stepper>
                            )}

                            {activeStep === taskSteps.length ? (
                                <React.Fragment>
                                    <div
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: '0px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '47.5%',
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                margin-bottom="12px"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                App Inputs
                                                <Visibility
                                                    height="25px"
                                                    width="25px"
                                                    sx={{
                                                        marginLeft: '7.5px',
                                                        display: 'inline-block',
                                                    }}
                                                />
                                            </Typography>
                                            <div
                                                style={{
                                                    border: '1px solid lightgray',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <BlocksRenderer state={step} />
                                            </div>
                                        </span>
                                        <span
                                            style={{
                                                width: '47.5%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                Outputs{' '}
                                                <Visibility
                                                    height="25px"
                                                    width="25px"
                                                    sx={{
                                                        marginLeft: '7.5px',
                                                        display: 'inline-block',
                                                    }}
                                                />
                                            </Typography>
                                            <div
                                                style={{
                                                    padding: '16px',
                                                    backgroundColor: '#fafafa',
                                                    borderRadius: '12px',
                                                    flex: '1',
                                                }}
                                            >
                                                {Object.entries(
                                                    step['variables'],
                                                ).map((variable) => {
                                                    const name = variable[0];
                                                    const value = variable[1];
                                                    if (value['isOutput']) {
                                                        return (
                                                            <div
                                                                style={{
                                                                    marginTop:
                                                                        '10px',
                                                                    marginRight:
                                                                        '12.5px',
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant={
                                                                        'caption'
                                                                    }
                                                                    sx={{
                                                                        borderRadius:
                                                                            '12px',
                                                                        background:
                                                                            '#eee',
                                                                        padding:
                                                                            '5px 15px',
                                                                    }}
                                                                >
                                                                    {name}
                                                                </Typography>
                                                            </div>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        </span>
                                    </div>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            pt: 2,
                                        }}
                                    >
                                        <Box sx={{ flex: '1 1 auto' }} />
                                        <Button onClick={handleReset}>
                                            Reset App Selection
                                        </Button>
                                    </Box>

                                    <div style={{ marginTop: '20px' }}>
                                        <Switch
                                            title={'Show App Inputs'}
                                            size="small"
                                            checked={isRawInputsShown}
                                            onChange={() => {
                                                setIsRawInputsShown(
                                                    !isRawInputsShown,
                                                );
                                            }}
                                        ></Switch>
                                        <span
                                            style={{
                                                marginLeft: '7.5px',
                                            }}
                                        >
                                            Show App Inputs
                                        </span>

                                        <div
                                            style={{
                                                display: isRawInputsShown
                                                    ? 'block'
                                                    : 'none',
                                                borderRadius: '12px',
                                                background: '#fafafa',
                                                padding: '12.5px 20px 30px',
                                                marginTop: '20px',
                                                marginBottom: '20px',
                                                width: '40%',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                            >
                                                App Inputs:
                                            </Typography>
                                            {Object.entries(
                                                step['variables'],
                                            ).map((variable) => {
                                                const name = variable[0];
                                                const value = variable[1];
                                                if (value['isInput']) {
                                                    return (
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    '10px',
                                                                marginRight:
                                                                    '12.5px',
                                                            }}
                                                        >
                                                            <Typography
                                                                variant={
                                                                    'caption'
                                                                }
                                                                sx={{
                                                                    borderRadius:
                                                                        '12px',
                                                                    background:
                                                                        '#eee',
                                                                    padding:
                                                                        '5px 15px',
                                                                }}
                                                            >
                                                                {name}
                                                            </Typography>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>
                                    </div>
                                </React.Fragment>
                            ) : (
                                <div>
                                    {(activeStep == 0 || activeStep == 1) && (
                                        <Box>
                                            <Typography
                                                variant={'body1'}
                                                sx={{ mt: 2, mb: 1 }}
                                            >
                                                These apps might be a good fit
                                                for this subtask. Select one to
                                                inspect and get started.
                                            </Typography>
                                            <Box
                                                sx={{
                                                    margin: '20px auto',
                                                    maxWidth: '1650px',
                                                    minWidth: '1400px',
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-around',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <IconButton
                                                    sx={{
                                                        opacity:
                                                            appCarouselOffset <
                                                            1
                                                                ? 0.5
                                                                : 1,
                                                    }}
                                                    disabled={
                                                        appCarouselOffset < 1
                                                    }
                                                    onClick={() => {
                                                        setAppCarouselOffset(
                                                            appCarouselOffset -
                                                                3,
                                                        );
                                                    }}
                                                >
                                                    <ChevronLeft />
                                                </IconButton>
                                                {appOptions
                                                    .slice(
                                                        appCarouselOffset,
                                                        appCarouselOffset + 3,
                                                    )
                                                    .map((appObj) => (
                                                        <AppSelectionCard
                                                            sx={{
                                                                border:
                                                                    appObj?.appId ==
                                                                    selectedSubTaskApp?.appId
                                                                        ? '2px solid #0471F0'
                                                                        : '2px solid #00000000',
                                                                ...(activeStep ==
                                                                1
                                                                    ? {
                                                                          height: 'auto',
                                                                      }
                                                                    : {}),
                                                            }}
                                                            onClick={() => {
                                                                setSelectedSubTaskApp(
                                                                    appObj,
                                                                );
                                                                if (
                                                                    activeStep ==
                                                                    0
                                                                ) {
                                                                    handleNext();
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    width: '100%',
                                                                    alignItems:
                                                                        'center',
                                                                    height: '47px',
                                                                    marginBottom:
                                                                        activeStep ==
                                                                        1
                                                                            ? '0px'
                                                                            : '8px',
                                                                }}
                                                            >
                                                                <img
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        borderRadius:
                                                                            '10px',
                                                                        backgroundImage: `url(${
                                                                            appObj.imgUrl ||
                                                                            DUMMY_IMG_URLS[
                                                                                appObj
                                                                                    .title
                                                                                    .length %
                                                                                    DUMMY_IMG_URLS.length
                                                                            ]
                                                                        })`,
                                                                        backgroundSize:
                                                                            'cover',
                                                                        backgroundPosition:
                                                                            'center',
                                                                        marginRight:
                                                                            '16px',
                                                                    }}
                                                                />
                                                                <Typography variant="body2">
                                                                    <b>
                                                                        {
                                                                            appObj.title
                                                                        }
                                                                    </b>
                                                                </Typography>
                                                            </div>
                                                            {activeStep ==
                                                                0 && (
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        width: '100%',
                                                                        height: '70px',
                                                                        marginBottom:
                                                                            '8px',
                                                                    }}
                                                                >
                                                                    <Typography variant="body2">
                                                                        {
                                                                            appObj.description
                                                                        }
                                                                    </Typography>
                                                                </div>
                                                            )}
                                                            {activeStep ==
                                                                0 && (
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            'flex',
                                                                        width: '100%',
                                                                        height: '42px',
                                                                    }}
                                                                >
                                                                    <Button
                                                                        variant="text"
                                                                        color="primary"
                                                                        endIcon={
                                                                            <OpenInNewRounded />
                                                                        }
                                                                    >
                                                                        Open
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </AppSelectionCard>
                                                    ))}
                                                {
                                                    <IconButton
                                                        sx={{
                                                            opacity:
                                                                appCarouselOffset >=
                                                                appOptions.length -
                                                                    3
                                                                    ? 0
                                                                    : 1,
                                                        }}
                                                        disabled={
                                                            appCarouselOffset >=
                                                            appOptions.length -
                                                                3
                                                        }
                                                        onClick={() => {
                                                            setAppCarouselOffset(
                                                                appCarouselOffset +
                                                                    3,
                                                            );
                                                            if (
                                                                appCarouselOffset >
                                                                appOptions.length -
                                                                    3
                                                            ) {
                                                                // TODO display blank card space or render text saying no more apps etc
                                                            }
                                                        }}
                                                    >
                                                        <ChevronRight />
                                                    </IconButton>
                                                }
                                            </Box>
                                            {selectedSubTaskApp && (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            marginTop: '15px',
                                                            marginBottom: '5px',
                                                        }}
                                                    >
                                                        <b>
                                                            {
                                                                selectedSubTaskApp.title
                                                            }
                                                        </b>
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            marginTop: '5px',
                                                            marginBottom:
                                                                '20px',
                                                        }}
                                                    >
                                                        {
                                                            selectedSubTaskApp.description
                                                        }
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            marginTop: '16px',
                                                            width: '503px',
                                                            border: '1px solid #e6e6e6',
                                                            borderRadius:
                                                                '12px',
                                                            padding: '12px',
                                                        }}
                                                    >
                                                        <BlocksRenderer
                                                            state={step}
                                                        />
                                                    </Box>
                                                    <Box
                                                        sx={{ width: '503px' }}
                                                    >
                                                        <Box>
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    flexDirection:
                                                                        'row',
                                                                    pt: 2,
                                                                }}
                                                            >
                                                                <Button
                                                                    color="inherit"
                                                                    onClick={
                                                                        handleBack
                                                                    }
                                                                    sx={{
                                                                        mr: 1,
                                                                    }}
                                                                >
                                                                    Back
                                                                </Button>
                                                                <Box
                                                                    sx={{
                                                                        flex: '1 1 auto',
                                                                    }}
                                                                />
                                                                <Button
                                                                    onClick={
                                                                        handleNext
                                                                    }
                                                                >
                                                                    Confirm
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {activeStep == 2 && (
                                        <Box
                                            sx={{
                                                padding: '16px 0 0 16px',
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    marginTop: '10px',
                                                    marginBottom: '5px',
                                                }}
                                            >
                                                Map the inputs and outputs from
                                                the app to the subtask inputs
                                                and outputs.
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    marginTop: '25px',
                                                    marginBottom: '15px',
                                                    fontSize: '15px',
                                                }}
                                            >
                                                <b>Inputs</b>
                                            </Typography>

                                            <Grid
                                                container
                                                spacing={1}
                                                sx={{ marginBottom: '7.5px' }}
                                            >
                                                <Grid item xs={1.85}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Subtask Inputs
                                                    </Typography>
                                                </Grid>
                                                <Grid
                                                    item
                                                    xs={1.25}
                                                    marginLeft="10px"
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Type
                                                    </Typography>
                                                </Grid>
                                                <Grid
                                                    item
                                                    xs={0.75}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {/* empty spacer */}
                                                </Grid>
                                                <Grid item xs={1.85}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        App Inputs
                                                    </Typography>
                                                </Grid>
                                                <Grid
                                                    item
                                                    xs={1}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'flex-start',
                                                        alignItems: 'center',
                                                        fontSize: '14px',
                                                        marginLeft: '15px',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Type
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    {/* empty spacer */}
                                                </Grid>
                                            </Grid>

                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                (ele, eleIdx) => (
                                                    <Grid
                                                        container
                                                        spacing={1}
                                                        key={eleIdx}
                                                    >
                                                        <Grid
                                                            item
                                                            xs={1.85}
                                                            sx={{
                                                                marginTop:
                                                                    '5px',
                                                            }}
                                                        >
                                                            {/* 1.85 */}
                                                            <Select
                                                                labelId="demo-simple-select-label"
                                                                id="demo-simple-select"
                                                                // onChange={handleChange}
                                                                // value={currentValue}
                                                                // label=""
                                                                size="small"
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '32px',
                                                                }}
                                                            >
                                                                {DUMMY_SUBTASK_INPUTS.map(
                                                                    (
                                                                        taskInput,
                                                                        idx,
                                                                    ) => (
                                                                        <MenuItem
                                                                            key={
                                                                                idx
                                                                            }
                                                                            value={
                                                                                taskInput
                                                                            }
                                                                        >
                                                                            {
                                                                                taskInput
                                                                            }
                                                                        </MenuItem>
                                                                    ),
                                                                )}
                                                            </Select>
                                                        </Grid>
                                                        <Grid
                                                            item
                                                            xs={1.25}
                                                            marginLeft="10px"
                                                        >
                                                            {/* 1.25 */}
                                                            <Select
                                                                labelId="demo-simple-select-label"
                                                                id="demo-simple-select"
                                                                // onChange={handleChange}
                                                                // value={currentValue}
                                                                // label=""
                                                                size="small"
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '32px',
                                                                }}
                                                            >
                                                                {DUMMY_INPUT_TYPES.map(
                                                                    (
                                                                        inputType,
                                                                        idx,
                                                                    ) => (
                                                                        <MenuItem
                                                                            key={
                                                                                idx
                                                                            }
                                                                            value={
                                                                                inputType
                                                                            }
                                                                        >
                                                                            {
                                                                                inputType
                                                                            }
                                                                        </MenuItem>
                                                                    ),
                                                                )}
                                                            </Select>
                                                        </Grid>
                                                        <Grid
                                                            item
                                                            xs={0.75}
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'center',
                                                                alignItems:
                                                                    'center',
                                                            }}
                                                        >
                                                            <ArrowRightAlt
                                                                sx={{
                                                                    color: '#BDBDBD',
                                                                    fontSize:
                                                                        '20px',
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={1.85}>
                                                            {/* 1.85 */}
                                                            <Select
                                                                labelId="demo-simple-select-label"
                                                                id="demo-simple-select"
                                                                size="small"
                                                                // onChange={handleChange}
                                                                // value={currentValue}
                                                                // label=""
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '32px',
                                                                }}
                                                            >
                                                                {DUMMY_SUBTASK_INPUTS.map(
                                                                    (
                                                                        taskInput,
                                                                        idx,
                                                                    ) => (
                                                                        <MenuItem
                                                                            key={
                                                                                idx
                                                                            }
                                                                            value={
                                                                                taskInput
                                                                            }
                                                                        >
                                                                            {
                                                                                taskInput
                                                                            }
                                                                        </MenuItem>
                                                                    ),
                                                                )}
                                                            </Select>
                                                        </Grid>
                                                        <Grid
                                                            item
                                                            xs={1.25}
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'flex-start',
                                                                alignItems:
                                                                    'center',
                                                                fontSize:
                                                                    '14px',
                                                                marginLeft:
                                                                    '15px',
                                                            }}
                                                        >
                                                            integer{' '}
                                                            {/* TODO This needs to be dynamic  */}
                                                        </Grid>
                                                        {eleIdx == 7 && (
                                                            <Grid item xs={3}>
                                                                <div
                                                                    style={{
                                                                        backgroundColor:
                                                                            '#FDF0E5',
                                                                        borderRadius:
                                                                            '7.5px',
                                                                        fontSize:
                                                                            '13px',
                                                                        padding:
                                                                            '2.5px',
                                                                        width: 'auto',
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    <ReportProblem
                                                                        sx={{
                                                                            color: 'orange',
                                                                            fontSize:
                                                                                '16px',
                                                                            marginLeft:
                                                                                '5px',
                                                                            marginRight:
                                                                                '5px',
                                                                        }}
                                                                    />
                                                                    File types
                                                                    do not
                                                                    match.{' '}
                                                                    <a
                                                                        href="#"
                                                                        style={{
                                                                            color: 'blue',
                                                                            marginRight:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        Convert
                                                                        app
                                                                        input?
                                                                    </a>
                                                                </div>
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                ),
                                            )}

                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    marginTop: '30px',
                                                    marginBottom: '15px',
                                                    fontSize: '15px',
                                                }}
                                            >
                                                <b>Outputs</b>
                                            </Typography>

                                            <Grid
                                                container
                                                spacing={1}
                                                sx={{ marginBottom: '7.5px' }}
                                            >
                                                <Grid item xs={1.85}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        App Outputs
                                                    </Typography>
                                                </Grid>
                                                <Grid
                                                    item
                                                    xs={1.25}
                                                    marginLeft="10px"
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Type
                                                    </Typography>
                                                </Grid>
                                                <Grid
                                                    item
                                                    xs={0.75}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {/* empty spacer */}
                                                </Grid>
                                                <Grid item xs={1.85}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Subtask Outputs
                                                    </Typography>
                                                </Grid>
                                                <Grid
                                                    item
                                                    xs={1}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'flex-start',
                                                        alignItems: 'center',
                                                        fontSize: '14px',
                                                        marginLeft: '15px',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Type
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    {/* empty spacer */}
                                                </Grid>
                                            </Grid>

                                            {[1, 2, 3].map((ele, eleIdx) => (
                                                <Grid
                                                    container
                                                    spacing={1}
                                                    key={eleIdx}
                                                >
                                                    <Grid
                                                        item
                                                        xs={1.85}
                                                        sx={{
                                                            marginTop: '5px',
                                                        }}
                                                    >
                                                        <Select
                                                            labelId="demo-simple-select-label"
                                                            id="demo-simple-select"
                                                            // onChange={handleChange}
                                                            // value={currentValue}
                                                            // label=""
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                height: '32px',
                                                            }}
                                                        >
                                                            {DUMMY_SUBTASK_INPUTS.map(
                                                                (
                                                                    taskInput,
                                                                    idx,
                                                                ) => (
                                                                    <MenuItem
                                                                        key={
                                                                            idx
                                                                        }
                                                                        value={
                                                                            taskInput
                                                                        }
                                                                    >
                                                                        {
                                                                            taskInput
                                                                        }
                                                                    </MenuItem>
                                                                ),
                                                            )}
                                                        </Select>
                                                    </Grid>
                                                    <Grid
                                                        item
                                                        xs={1.25}
                                                        marginLeft="10px"
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent:
                                                                'flex-start',
                                                            alignItems:
                                                                'center',
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        integer
                                                    </Grid>
                                                    <Grid
                                                        item
                                                        xs={0.75}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent:
                                                                'center',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <ArrowRightAlt
                                                            sx={{
                                                                color: '#BDBDBD',
                                                                fontSize:
                                                                    '20px',
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={1.85}>
                                                        {/* 1.85 */}
                                                        <Select
                                                            labelId="demo-simple-select-label"
                                                            id="demo-simple-select"
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                height: '32px',
                                                            }}
                                                        >
                                                            {DUMMY_SUBTASK_INPUTS.map(
                                                                (
                                                                    taskInput,
                                                                    idx,
                                                                ) => (
                                                                    <MenuItem
                                                                        key={
                                                                            idx
                                                                        }
                                                                        value={
                                                                            taskInput
                                                                        }
                                                                    >
                                                                        {
                                                                            taskInput
                                                                        }
                                                                    </MenuItem>
                                                                ),
                                                            )}
                                                        </Select>
                                                    </Grid>
                                                    <Grid
                                                        item
                                                        xs={1.25}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent:
                                                                'flex-start',
                                                            alignItems:
                                                                'center',
                                                            fontSize: '14px',
                                                            marginLeft: '15px',
                                                        }}
                                                    >
                                                        <Select
                                                            labelId="demo-simple-select-label"
                                                            id="demo-simple-select"
                                                            // onChange={handleChange}
                                                            // value={currentValue}
                                                            // label=""
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                height: '32px',
                                                            }}
                                                        >
                                                            {DUMMY_INPUT_TYPES.map(
                                                                (
                                                                    inputType,
                                                                    idx,
                                                                ) => (
                                                                    <MenuItem
                                                                        key={
                                                                            idx
                                                                        }
                                                                        value={
                                                                            inputType
                                                                        }
                                                                    >
                                                                        {
                                                                            inputType
                                                                        }
                                                                    </MenuItem>
                                                                ),
                                                            )}
                                                        </Select>
                                                    </Grid>
                                                </Grid>
                                            ))}

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    pt: 2,
                                                }}
                                            >
                                                <Button
                                                    color="inherit"
                                                    onClick={handleBack}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Back
                                                </Button>
                                                <Box
                                                    sx={{ flex: '1 1 auto' }}
                                                />
                                                <Button onClick={handleNext}>
                                                    Confirm Mapping
                                                </Button>
                                            </Box>
                                        </Box>
                                    )}

                                    {activeStep == 3 && (
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    marginBottom: '5px',
                                                    marginTop: '15px',
                                                }}
                                            >
                                                <b>
                                                    {selectedSubTaskApp.title}
                                                </b>
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    marginBottom: '20px',
                                                    marginTop: '5px',
                                                }}
                                            >
                                                {selectedSubTaskApp.description}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    marginTop: '16px',
                                                    border: '1px solid #e6e6e6',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    width: '503px',
                                                }}
                                            >
                                                <BlocksRenderer state={step} />
                                            </Box>
                                            <Box sx={{ width: '503px' }}>
                                                <Box>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection:
                                                                'row',
                                                            pt: 2,
                                                        }}
                                                    >
                                                        <Button
                                                            color="inherit"
                                                            onClick={handleBack}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            Back
                                                        </Button>
                                                        <Box
                                                            sx={{
                                                                flex: '1 1 auto',
                                                            }}
                                                        />
                                                        <Button
                                                            onClick={handleNext}
                                                        >
                                                            Complete Subtask
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </div>
                            )}
                        </Box>
                    </Stack>
                </Accordion.Content>
            </Accordion>
        );
    },
);
