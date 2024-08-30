import React from 'react';
import { useConductor } from '@/hooks';
import { Stack, Typography } from '@semoss/ui';
import { ConductorStep } from './ConductorStep';

export const Conductor = () => {
    const { conductor } = useConductor();

    return (
        <Stack
            direction={'column'}
            gap={1}
            // sx={{ overflow: 'scroll', border: 'solid red' }}
        >
            <Typography variant={'h6'}> Overall Input Pool</Typography>
            <div>{JSON.stringify(conductor.inputPool)}</div>
            <Typography variant={'h4'}>Task</Typography>
            <Typography variant={'h5'}>
                Hey am i qualified for this job?
            </Typography>
            {conductor.steps.map((step, i) => {
                return (
                    <ConductorStep
                        key={i}
                        taskIndex={i}
                        type={'app'}
                        step={step}
                    />
                );
            })}
        </Stack>
    );
};
