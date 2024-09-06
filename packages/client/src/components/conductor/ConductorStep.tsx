import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
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
                {Object.entries(step.variables).map((variable) => {
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
                {Object.entries(step.variables).map((variable) => {
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
                        <BlocksRenderer state={step} />
                    </Stack>
                ) : (
                    <>test</>
                )}
            </Stack>
        );
    },
);
