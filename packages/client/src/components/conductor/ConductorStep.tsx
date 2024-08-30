import React from 'react';
import { observer } from 'mobx-react-lite';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';

interface ConductorStepProps {
    type: 'app' | 'widget';
    /**
     * Can be represented as an app or another widget
     */
    step: unknown | SerializedState;

    taskIndex: number;
}
export const ConductorStep = observer(
    ({ step, type, taskIndex }: ConductorStepProps) => {
        console.log('step', step);

        return (
            <Stack
                direction="column"
                sx={{ backgroundColor: 'yellow', padding: '24px' }}
            >
                <Typography variant="h6">Subtask {taskIndex + 1} </Typography>
                <Typography variant={'h6'}>
                    ----------------------------------------------------------
                </Typography>

                <Typography variant="body2">Inputs for app</Typography>
                {JSON.stringify(step.variables)}
                <Typography variant={'h6'}>
                    ----------------------------------------------------------
                </Typography>
                <Typography variant="body2">
                    Actual App Implementation
                </Typography>

                {type === 'app' ? <BlocksRenderer state={step} /> : <>test</>}
            </Stack>
        );
    },
);
