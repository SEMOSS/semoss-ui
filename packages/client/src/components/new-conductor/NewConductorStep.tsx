import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import { Stack, Typography, Accordion, IconButton, Switch } from '@semoss/ui';
import { useConductor } from '@/hooks';
import {
    Visibility,
    Person,
    KeyboardArrowDown,
    Create,
    DataObject,
    DisplaySettings,
} from '@mui/icons-material';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

import Carousel from './Carousel';

interface NewConductorStepProps {
    /**
     * Can be represented as an app or another widget
     */
    step: unknown | SerializedState;
    /**
     * Will it be an app or some python script or other widget
     */
    type: 'app' | 'widget';
    /**
     * What Task index does this refer to that we get from BE
     */
    taskIndex: number;
    selectedSubtask: number;
    setSelectedSubtask: Function;
    taskEditorHistory: Array<number>;
    setTaskEditorHistory: Function;
    openAccordionIndexesSet: Set<number | unknown>;
    setOpenAccordionIndexesSet: Function;
}

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
    }: NewConductorStepProps) => {
        console.log({ taskIndex, step });
        const { conductor } = useConductor();

        console.log({
            // step,
            // "Object.keys(step)": Object.keys(step),
            queries: step['queries'],
            blocks: step['blocks'],
            variables: step['variables'],
            dependencies: step['dependencies'],
            version: step['version'],
            'JSON.stringify(step)': JSON.stringify(step),
        });

        /**
         * Set input pool values on mount
         */
        useEffect(() => {
            // debugger;
            Object.entries(step.variables).forEach((variable) => {
                const name = variable[0];
                const value = variable[1];
                // debugger;
                if (value.isInput || value.isOutput) {
                    let v = '';
                    if (value.type === 'block') {
                        v = step.blocks[value.to].data.value;
                    } else {
                        v = 'get the value from blocks';
                    }
                    conductor.setInputValue(name, v);
                }
            });
        }, [Object.keys(step).length, type]);

        const [isExpanded, setHistoryExpanded] = useState(false);
        const [isRawInputsShown, setIsRawInputsShown] = useState(false);

        return (
            <Accordion
                expanded={isExpanded}
                onChange={(e) => {
                    setHistoryExpanded(!isExpanded);
                }}
                sx={{
                    // marginBottom: '17.5px',
                    // border: '3px dotted red',
                    paddingTop: '0px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                }}
            >
                <Accordion.Trigger expandIcon={<KeyboardArrowDown />}>
                    <div
                        style={{
                            // border: '1px solid red',
                            width: '100%',
                            display: 'flex',
                            alignContent: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '0px',
                        }}
                    >
                        {/* <b style={{
                            border: '1px solid blue'
                        }}>Subtask {taskIndex + 1}</b> */}
                        <Typography
                            variant="body1"
                            sx={{
                                // border: '1px solid violet',
                                height: '42px',
                                lineHeight: '42px',
                                fontWeight: '800',
                                // verticalAlign: 'middle',
                                // display: 'inline-block'
                            }}
                        >
                            Subtask {taskIndex + 1}
                        </Typography>
                        <IconButton
                            onClick={(e) => {
                                setSelectedSubtask(taskIndex);
                                e.stopPropagation();
                            }}
                        >
                            <DataObject />
                        </IconButton>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content
                // sx={{ border: '1px solid black' }}
                >
                    <Stack
                        direction="column"
                        sx={{
                            // backgroundColor: '#fafafa',
                            backgroundColor: '#fff',
                            // border: '1px solid black',
                            padding: '16px',
                            borderRadius: '12px',
                            paddingTop: '0px',
                        }}
                    >
                        {/* <Typography variant="h6">
                            Subtask {taskIndex + 1}
                        </Typography> */}

                        <Stepper
                            sx={{
                                maxWidth: '350px',
                                border: '2px solid black',
                            }}
                            activeStep={0}
                            alternativeLabel
                        >
                            {['one', 'two', 'three'].map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <div
                            style={{
                                border: '2px solid red',
                                maxWidth: '100%',
                            }}
                        >
                            <Carousel
                                items={[
                                    {
                                        title: 'test 1',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 2',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 3',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 4',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 5',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 11',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 12',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 13',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 14',
                                        content: 'placeholder content',
                                    },
                                    {
                                        title: 'test 15',
                                        content: 'placeholder content',
                                    },
                                ]}
                            />
                        </div>

                        <div
                            style={{
                                width: '100%',
                                // border: '1px solid black',
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: '0px',
                            }}
                        >
                            <span
                                style={{
                                    // left span for inputs? just render app for now?
                                    // border: '1px solid black',
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
                                {/* <h2>
                                </h2> */}
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
                                    // right span for outputs? just gray box for now
                                    // border: '1px solid black',
                                    // display: 'inline-block',
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
                                {/* <Typography variant="body2" fontWeight="bold">
                                    Outputs for app:{' '}
                                </Typography> */}
                                <div
                                    style={{
                                        padding: '16px',
                                        // marginBottom: '20px',
                                        backgroundColor: '#fafafa',
                                        borderRadius: '12px',
                                        flex: '1',
                                    }}
                                >
                                    {Object.entries(step.variables).map(
                                        (variable) => {
                                            const name = variable[0];
                                            const value = variable[1];
                                            if (value.isOutput) {
                                                return (
                                                    <div
                                                        style={{
                                                            marginTop: '10px',
                                                            // display: 'inline-block',
                                                            marginRight:
                                                                '12.5px',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant={'caption'}
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
                                        },
                                    )}
                                </div>
                            </span>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <Switch
                                title={'Show App Inputs'}
                                size="small"
                                checked={isRawInputsShown}
                                onChange={() => {
                                    setIsRawInputsShown(!isRawInputsShown);
                                }}
                            ></Switch>
                            <span
                                style={{
                                    marginLeft: '7.5px',
                                }}
                            >
                                {/* <b> */}
                                Show App Inputs
                                {/* </b> */}
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
                                <Typography variant="h6" fontWeight="bold">
                                    App Inputs:
                                </Typography>
                                {Object.entries(step.variables).map(
                                    (variable) => {
                                        const name = variable[0];
                                        const value = variable[1];
                                        if (value.isInput) {
                                            return (
                                                <div
                                                    style={{
                                                        marginTop: '10px',
                                                        // display: 'inline-block',
                                                        marginRight: '12.5px',
                                                    }}
                                                >
                                                    <Typography
                                                        variant={'caption'}
                                                        sx={{
                                                            borderRadius:
                                                                '12px',
                                                            background: '#eee',
                                                            padding: '5px 15px',
                                                        }}
                                                    >
                                                        {name}
                                                    </Typography>
                                                </div>
                                            );
                                        }
                                    },
                                )}
                            </div>
                        </div>

                        {/* <Typography variant={'h6'}>
                            ----------------------------------------------------------
                        </Typography> */}
                        {/* <Typography variant="body2" fontWeight="bold">
                            Actual App Implementation
                        </Typography> */}

                        {/* TODO: How will we communicate changes to inputs and outputs of Apps to our conductor state */}
                        {/* {type === 'app' ? (
                            <Stack sx={{ border: '1px solid black' }}>
                                <BlocksRenderer state={step} />
                            </Stack>
                        ) : (
                            <>test</>
                        )} */}
                    </Stack>
                </Accordion.Content>
            </Accordion>
        );
    },
);
