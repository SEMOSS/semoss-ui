import { useState } from 'react';
import { Button, Checkbox, Stack, styled } from '@semoss/ui';

const Spacer = styled('div')(({}) => ({
    display: 'flex',
    flex: 1,
}));

// TODO: store "Don't show again" checkbox value on BE attached to user metadata
export const WelcomeStepActions = (props: {
    isFirstStep: boolean;
    isLastStep: boolean;
    nextStepAction: () => void;
    previousStepAction: () => void;
}) => {
    const [localStorageValue, setLocalStorageValue] = useState(false);

    const onCheckboxChange = () => {
        const newLocalStorageValue = !localStorageValue;
        if (newLocalStorageValue) {
            localStorage.setItem('platform-welcome', 'true');
        } else {
            localStorage.removeItem('platform-welcome');
        }
        setLocalStorageValue(newLocalStorageValue);
    };

    return (
        <Stack direction="row" spacing={2}>
            {props.isFirstStep ? (
                <Checkbox
                    label="Don't show again"
                    checked={localStorageValue}
                    onChange={onCheckboxChange}
                />
            ) : (
                <></>
            )}
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
                {props?.isLastStep ? 'Finish' : 'Next'}
            </Button>
        </Stack>
    );
};
