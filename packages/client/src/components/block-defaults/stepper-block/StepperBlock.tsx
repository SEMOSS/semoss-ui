import React from 'react';
import { useBlock, useDebounce } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { observer } from 'mobx-react-lite';
import { Step, StepLabel, Stepper } from '@mui/material';

export interface StepperBlockDef extends BlockDef<'stepper'> {
    widget: 'stepper';
    data: {
        steps: [];
        activeStep: 0;
    };
}

export const StepperBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<StepperBlockDef>(id);

    const { steps, activeStep } = data;

    return (
        <Stepper {...attrs}>
            {steps.map((label, i) => {
                return (
                    <Step key={`${id}--${label}--${i}`}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                );
            })}
        </Stepper>
    );
});
