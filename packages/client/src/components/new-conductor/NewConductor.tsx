import React from 'react';
import { useConductor } from '@/hooks';
import { Stack, Typography } from '@semoss/ui';
import { NewConductorStep } from './NewConductorStep';
import { observer } from 'mobx-react-lite';
import { Visibility, Person } from '@mui/icons-material';

export const Conductor = observer(() => {
    const { conductor } = useConductor();

    return (
        <Stack
            direction={'column'}
            gap={1}
            sx={{
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: '#f3f3f3',
            }}
        >
            <div
                style={{
                    border: '1px solid green',
                    width: '100%',
                }}
            >
                <span
                    style={{
                        border: '1px solid goldenrod',
                        width: '75%',
                        display: 'inline-block',
                    }}
                >
                    <Typography variant={'h4'} fontWeight="bold">
                        Task
                    </Typography>
                    <Typography
                        variant={'h5'}
                        sx={{
                            backgroundColor: '#fafafa',
                            padding: '16px',
                            borderRadius: '12px',
                        }}
                    >
                        <Person /> Hey am i qualified for this job? If so can
                        you approve me or reject me for position.
                    </Typography>
                    {conductor.steps.map((step, i) => {
                        return (
                            <NewConductorStep
                                key={i}
                                taskIndex={i}
                                type={'app'}
                                step={step}
                            />
                        );
                    })}
                </span>
                <span
                    style={{
                        border: '1px solid cornflowerblue',
                        width: '25%',
                        display: 'inline-block',
                    }}
                >
                    <Typography variant={'h6'}> Overall Input Pool</Typography>
                    <div>{JSON.stringify(conductor.inputPool)}</div>
                </span>
            </div>
        </Stack>
    );
});
