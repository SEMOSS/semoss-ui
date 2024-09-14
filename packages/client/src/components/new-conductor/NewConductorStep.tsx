import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import { Stack, Typography, Accordion, IconButton } from '@semoss/ui';
import { useConductor } from '@/hooks';
import {
    Visibility,
    Person,
    KeyboardArrowDown,
    Create,
    DataObject,
} from '@mui/icons-material';

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
        console.log('step', step);
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
        // useEffect(() => {
        //     Object.entries(step.variables).forEach((variable) => {
        //         const name = variable[0];
        //         const value = variable[1];

        //         if (value.isInput || value.isOutput) {
        //             let v = '';
        //             if (value.type === 'block') {
        //                 v = step.blocks[value.to].data.value;
        //             } else {
        //                 v = 'get the value from blocks';
        //             }
        //             conductor.setInputValue(name, v);
        //         }
        //     });
        // }, [Object.keys(step).length, type]);

        const [isExpanded, setHistoryExpanded] = useState(false);

        return (
            <Accordion
                expanded={isExpanded}
                onChange={(e) => {
                    setHistoryExpanded(!isExpanded);
                }}
                sx={{
                    marginBottom: '17.5px',
                    // border: '3px dotted red',
                    paddingTop: '0px',
                    borderRadius: '12px',
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
                            onClick={() => {
                                setSelectedSubtask(taskIndex);
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
                        }}
                    >
                        {/* <Typography variant="h6">
                            Subtask {taskIndex + 1}
                        </Typography> */}

                        <div
                            style={{
                                width: '100%',
                                // border: '1px solid black',
                                display: 'flex',
                                justifyContent: 'space-between',
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
                                <Typography variant="body1">
                                    Inputs <Visibility />
                                </Typography>
                                {/* <h2>
                                </h2> */}
                                <div
                                    style={{
                                        border: '3px solid gray',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <BlocksRenderer state={step} />
                                </div>
                            </span>
                            <span
                                style={{
                                    // right span for outputs? just gray box for now
                                    // border: '1px solid black',
                                    display: 'inline-block',
                                    width: '47.5%',
                                }}
                            >
                                <h2>
                                    Outputs <Visibility />
                                </h2>
                                {/* <Typography variant="body2" fontWeight="bold">
                                    Outputs for app:{' '}
                                </Typography> */}
                                <div
                                    style={{
                                        padding: '16px',
                                        marginBottom: '20px',
                                        backgroundColor: '#fafafa',
                                        borderRadius: '12px',
                                    }}
                                >
                                    {Object.entries(step.variables).map(
                                        (variable) => {
                                            const name = variable[0];
                                            const value = variable[1];
                                            if (value.isOutput) {
                                                return (
                                                    <Typography
                                                        variant={'caption'}
                                                    >
                                                        {name}
                                                    </Typography>
                                                );
                                            }
                                        },
                                    )}
                                </div>
                            </span>
                        </div>

                        <div>
                            <Typography variant="body2" fontWeight="bold">
                                Inputs for app:
                            </Typography>
                            {Object.entries(step.variables).map((variable) => {
                                const name = variable[0];
                                const value = variable[1];
                                if (value.isInput) {
                                    return (
                                        <Typography variant={'caption'}>
                                            {name}
                                        </Typography>
                                    );
                                }
                            })}
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
