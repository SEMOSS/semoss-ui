import React from 'react';
import { useConductor } from '@/hooks';
import { Stack, Typography } from '@semoss/ui';
import { ConductorStep } from './ConductorStep';
import { observer } from 'mobx-react-lite';

export const Conductor = observer(() => {
    const { conductor } = useConductor();

    return (
        <Stack
            direction={'column'}
            gap={1}
            // sx={{ overflow: 'scroll', border: 'solid red' }}
        >
            <Typography variant={'h6'}> Overall Input Pool</Typography>
            <div>{JSON.stringify(conductor.inputPool)}</div>
            <Typography variant={'h4'} fontWeight="bold">
                Task
            </Typography>
            <Typography variant={'h5'}>
                Hey am i qualified for this job? If so can you approve me or
                reject me for position.
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
});
