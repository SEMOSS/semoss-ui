import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import { Stack, Typography, Button } from '@semoss/ui';
import { useConductor } from '@/hooks';

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

export const ConductorStep = observer(
    ({ step, type, taskIndex }: ConductorStepProps) => {
        console.log('step', step);
        const { conductor } = useConductor();

        const stepDup = JSON.parse(JSON.stringify(step));

        /**
         * Set input pool values on mount
         */
        useEffect(() => {
            Object.entries(stepDup.variables).forEach((variable) => {
                const name = variable[0];
                const value = variable[1];

                if (value.isInput || value.isOutput) {
                    let v = '';
                    if (value.type === 'block') {
                        v = stepDup.blocks[value.to].data.value;
                    } else {
                        v = 'get the value from blocks';
                    }
                    conductor.setInputValue(name, v);
                }
            });
        }, [Object.keys(step).length, type]);

        return (
            <Stack
                direction="column"
                sx={{
                    // backgroundColor: 'yellow',
                    border: 'solid 25px grey',
                    padding: '24px',
                }}
            >
                <Typography variant="h6">Subtask {taskIndex + 1} </Typography>
                <Typography variant={'h6'}>
                    ----------------------------------------------------------
                </Typography>

                <Typography variant="body2" fontWeight="bold">
                    Inputs for app:
                </Typography>
                {Object.entries(stepDup.variables).map((variable) => {
                    const name = variable[0];
                    const value = variable[1];
                    if (value.isInput) {
                        return (
                            <Typography variant={'caption'}>{name}</Typography>
                        );
                    }
                })}
                <Typography variant={'h6'}>
                    ----------------------------------------------------------
                </Typography>

                <Typography variant="body2" fontWeight="bold">
                    Outputs for app:{' '}
                </Typography>
                {Object.entries(stepDup.variables).map((variable) => {
                    const name = variable[0];
                    const value = variable[1];
                    if (value.isOutput) {
                        return (
                            <Typography variant={'caption'}>{name}</Typography>
                        );
                    }
                })}
                <Typography variant={'h6'}>
                    ----------------------------------------------------------
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                    Actual App Implementation
                </Typography>

                {/* TODO: How will we communicate changes to inputs and outputs of Apps to our conductor state */}
                {type === 'app' ? (
                    <Stack sx={{ border: 'solid 3px blue' }}>
                        <Button
                            variant="contained"
                            onClick={() => (stepDup['version'] = 'foo')}
                        >
                            change version
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() =>
                                console.log({
                                    step,
                                    keys: Object.keys(step),
                                    queries: stepDup['queries'],
                                    blocks: stepDup['blocks'],
                                    variables: stepDup['variables'],
                                    dependencies: stepDup['dependencies'],
                                    version: stepDup['version'],
                                })
                            }
                        >
                            print step
                        </Button>
                        <BlocksRenderer state={stepDup} />
                    </Stack>
                ) : (
                    <>test</>
                )}
            </Stack>
        );
    },
);
