import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { observer } from 'mobx-react-lite';
import { Step, StepLabel, Stepper, Typography } from '@mui/material';

interface Title {
    name: string;
    id?: number;
}

export interface StepperBlockDef extends BlockDef<'stepper'> {
    widget: 'stepper';
    data: {
        active: number;
        steps: Title[];
    };
}

export const StepperBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<StepperBlockDef>(id);
    const { active } = data;
    return (
        <>
            <Stepper {...attrs} activeStep={active}>
                {data.steps?.map((obj, i) => {
                    return (
                        <Step key={`${id}--${obj.name}--${i}`}>
                            <StepLabel>{obj.name}</StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
            {Number(active) >= data.steps?.length ? (
                <Typography variant="caption">All steps completed</Typography>
            ) : active ? (
                <>
                    <Typography variant="subtitle1">Step {active}</Typography>
                </>
            ) : (
                ''
            )}
        </>
    );
});
