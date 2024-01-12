import { Button, Checkbox, Stack, styled } from '@semoss/ui';

const Spacer = styled('div')(({}) => ({
    display: 'flex',
    flex: 1,
}));

// TODO: store "Don't show again" checkbox value on BE
export const StepActions = (props: {
    isFirstStep: boolean;
    isLastStep: boolean;
    nextStepAction: () => void;
    previousStepAction: () => void;
}) => {
    return (
        <Stack direction="row" spacing={2}>
            {props.isFirstStep ? <Checkbox label="Don't show again" /> : <></>}
            <Spacer />
            {props.isFirstStep ? (
                <></>
            ) : (
                <Button
                    variant="text"
                    color="primary"
                    onClick={props.previousStepAction}
                >
                    Back
                </Button>
            )}
            <Button
                variant="contained"
                color="primary"
                onClick={props.nextStepAction}
            >
                {props?.isLastStep ? 'Start Tour' : 'Next'}
            </Button>
        </Stack>
    );
};
