import React, { useEffect, useMemo, useState } from 'react';
import {
    Typography,
    IconButton,
    Accordion,
    Stack,
    Switch,
    styled,
    Box,
    Tooltip,
    Grid,
    Button,
    CircularProgress,
} from '@semoss/ui';
import { SerializedState } from '@/stores';
import { runPixel } from '@/api';
import {
    DataObject,
    InfoRounded,
    KeyboardArrowDownRounded,
    OpenInNewRounded,
} from '@mui/icons-material';
import { useConductor } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { Step, StepLabel, Stepper } from '@mui/material';

import { SubtaskSelectedAppInputs } from './SubtaskSelectedAppInputs';
import { SubtaskExecutionWrapper } from './SubtaskExecutionWrapper';

const SubTaskInnerContainer = styled('div')(({ theme }) => ({
    flexGrow: '1',
}));

const AppCard = styled(Box)(({ theme }) => ({
    boxShadow: '-2px 2px 12px #00000010',
    flexDirection: 'column',
    borderRadius: '10px',
    width: '421px',
    // height: '184px',
    display: 'flex',
    cursor: 'pointer',
    padding: '16px',
    gap: '8px',
}));

interface SubtaskWrapperProps {
    /**
     * id of the subtask
     */
    id: string;
    /**
     * index of the subtask
     */
    index: number;
}

interface AppInterface {
    /**
     * id
     */
    project_id: string;

    /**
     * App Name
     */
    project_name: string;

    /**
     * App Description
     */
    description: string;

    /**
     * State behind the App
     */
    state: SerializedState;
}

const SubtaskSteps = {
    0: 'Select App',
    1: 'Show Inputs',
    2: 'Execute App',
};

/**
 * Allows you to select which app you want use to perform said task
 */
export const SubtaskWrapper = observer((props: SubtaskWrapperProps) => {
    const { index, id } = props;

    const { conductor } = useConductor();

    const subtask = conductor.getSubtask(id);

    if (!subtask) {
        return <>unable to locate subtask</>;
    }

    const [isExpanded, setIsExpanded] = useState(false);

    const activeStep = useMemo(() => {
        if (subtask.selectedApp) {
            if (!subtask.isReady) {
                return 1;
            } else {
                return 2;
            }
        } else {
            return 0;
        }
    }, [subtask.selectedApp, subtask.isReady]);

    return (
        <SubTaskInnerContainer>
            <Accordion
                expanded={isExpanded}
                onChange={(e) => {
                    setIsExpanded(!isExpanded);
                }}
                sx={{
                    paddingTop: '0px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                }}
            >
                <Accordion.Trigger expandIcon={<KeyboardArrowDownRounded />}>
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
                                overflow: 'hidden',
                            }}
                        >
                            <b style={{ marginRight: '10px' }}>
                                Subtask {index + 1}
                            </b>{' '}
                            <Tooltip
                                title={
                                    <Stack direction={'column'} gap={1}>
                                        <Typography variant="body1">
                                            Subtask Id:
                                            {subtask.id}
                                        </Typography>
                                        <Typography variant={'body2'}>
                                            Selected App:
                                            {subtask.selectedApp}
                                        </Typography>
                                    </Stack>
                                }
                            >
                                <IconButton size="small">
                                    <InfoRounded fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {subtask.description}
                        </Typography>
                        <IconButton
                            onClick={(e) => {
                                // setSelectedSubtask(taskIndex);
                                e.stopPropagation();
                            }}
                        >
                            <DataObject />
                        </IconButton>
                        {subtask.isLoading && <CircularProgress />}
                    </div>
                </Accordion.Trigger>
                <Accordion.Content sx={isExpanded ? {} : { display: 'none' }}>
                    <Stack gap={1}>
                        <Stepper activeStep={activeStep} sx={{ width: '80%' }}>
                            <Step
                                onClick={() => {
                                    subtask.setSelectedApp();
                                }}
                            >
                                <StepLabel>Select app</StepLabel>
                            </Step>
                            <Step
                            // onClick={() => {}}
                            >
                                <StepLabel>Map User inputs</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Complete subtask</StepLabel>
                            </Step>
                        </Stepper>

                        {activeStep === 0 && (
                            <Grid container>
                                {subtask.apps.length &&
                                    subtask.apps.map((a) => {
                                        return (
                                            <Grid
                                                item
                                                xs={4}
                                                key={`${subtask.id}--${a.project_id}`}
                                            >
                                                <AppCard
                                                    key={`${a.project_id}`}
                                                    sx={{
                                                        border:
                                                            subtask.selectedApp ===
                                                            a.project_id
                                                                ? '2px solid #0471F0'
                                                                : '2px solid #00000000',
                                                        // ...(activeStep == 1
                                                        //     ? {
                                                        //           height: 'auto',
                                                        //       }
                                                        //     : {}),
                                                    }}
                                                    onClick={() => {
                                                        subtask.setSelectedApp(
                                                            a.project_id,
                                                        );
                                                    }}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        gap={1}
                                                        alignItems={'center'}
                                                    >
                                                        <img
                                                            style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                borderRadius:
                                                                    '10px',
                                                                backgroundImage: `url('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.7KXbdcsH9BKcYhKmd8hymAHaEu%26pid%3DApi&f=1&ipt=3d3e9d8d20653b1232ac8f02920cfca90faff98e890696f3aa1f8363e64d9758&ipo=images')`,
                                                                backgroundSize:
                                                                    'cover',
                                                                backgroundPosition:
                                                                    'center',
                                                                marginRight:
                                                                    '16px',
                                                            }}
                                                        />
                                                        <Typography variant="body1">
                                                            <b>
                                                                {a.project_name}
                                                            </b>{' '}
                                                            <Tooltip
                                                                title={`Project Id: ${a.project_id}`}
                                                            >
                                                                <IconButton size="small">
                                                                    <InfoRounded fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Typography>
                                                    </Stack>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            display:
                                                                '-webkit-box',
                                                            WebkitBoxOrient:
                                                                'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow:
                                                                'ellipsis',
                                                            WebkitLineClamp: 3,
                                                        }}
                                                    >
                                                        {a.description}
                                                    </Typography>{' '}
                                                    <a
                                                        target="new"
                                                        href={`#/app/${a.project_id}`}
                                                    >
                                                        <Button
                                                            variant="text"
                                                            color="primary"
                                                            endIcon={
                                                                <OpenInNewRounded />
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            Open
                                                        </Button>
                                                    </a>
                                                </AppCard>
                                            </Grid>
                                        );
                                    })}
                            </Grid>
                        )}

                        {/* Show the inputs that are associated to the app */}
                        {activeStep === 1 && (
                            <SubtaskSelectedAppInputs
                                id={id}
                                onComplete={(data) => {
                                    // set state in conductor for app inputs
                                    subtask.setSubtaskInputs(data);
                                }}
                            />
                        )}

                        {activeStep === 2 && (
                            <SubtaskExecutionWrapper id={id} />
                        )}
                    </Stack>
                </Accordion.Content>
            </Accordion>
        </SubTaskInnerContainer>
    );
});
