import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import { Stack, Typography, Accordion } from '@semoss/ui';
import { useConductor } from '@/hooks';
import { Visibility, Person, KeyboardArrowDown } from '@mui/icons-material';

interface ConductorStepProps {
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
}

export const NewConductorStep = observer(
    ({ step, type, taskIndex }: ConductorStepProps) => {
        console.log('step', step);
        const { conductor } = useConductor();

        /**
         * Set input pool values on mount
         */
        useEffect(() => {
            Object.entries(step.variables).forEach((variable) => {
                const name = variable[0];
                const value = variable[1];

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

        const [historyExpanded, setHistoryExpanded] = useState(false);

        return (
            <Accordion
                expanded={historyExpanded}
                onChange={(e) => {
                    setHistoryExpanded(!historyExpanded);
                }}
                sx={{ marginBottom: '30px', border: '5px solid pink' }}
            >
                <Accordion.Trigger expandIcon={<KeyboardArrowDown />}>
                    Subtask {taskIndex + 1}
                </Accordion.Trigger>
                <Accordion.Content sx={{ border: '5px solid pink' }}>
                    <Stack
                        direction="column"
                        sx={{
                            backgroundColor: '#fafafa',
                            // border: '1px solid blue',
                            padding: '16px',
                            borderRadius: '12px',
                        }}
                    >
                        <Typography variant="h6">
                            Subtask {taskIndex + 1}{' '}
                        </Typography>

                        <div
                            style={{
                                width: '100%',
                                border: '1px solid red',
                                display: 'flex',
                            }}
                        >
                            <span
                                style={{
                                    // left span for inputs? just render app for now?
                                    border: '1px solid blue',
                                    display: 'inline-block',
                                    width: '50%',
                                }}
                            >
                                <h2>
                                    Inputs <Visibility />
                                </h2>
                                <BlocksRenderer state={step} />
                            </span>
                            <span
                                style={{
                                    // right span for outputs? just gray box for now
                                    border: '1px solid pink',
                                    display: 'inline-block',
                                    width: '50%',
                                }}
                            >
                                <h2>
                                    Outputs <Visibility />
                                </h2>
                                <Typography variant="body2" fontWeight="bold">
                                    Outputs for app:{' '}
                                </Typography>
                                {Object.entries(step.variables).map(
                                    (variable) => {
                                        const name = variable[0];
                                        const value = variable[1];
                                        if (value.isOutput) {
                                            return (
                                                <Typography variant={'caption'}>
                                                    {name}
                                                </Typography>
                                            );
                                        }
                                    },
                                )}
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
                            <Stack sx={{ border: 'solid 3px red' }}>
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
