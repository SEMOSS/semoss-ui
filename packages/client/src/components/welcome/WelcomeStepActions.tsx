import { useState } from 'react';
import {
    Button,
    Checkbox,
    Stack,
    Typography,
    styled,
} from '@/component-library';

const Spacer = styled('div')(({}) => ({
    display: 'flex',
    flex: 1,
}));

const StyledDiv = styled('div')(() => ({
    alignItems: 'end',
    display: 'flex',
}));

const StyledCheckbox = styled(Checkbox)(() => ({
    '& .MuiSvgIcon-root': {
        fontSize: '20px',
    },
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
                <StyledCheckbox
                    label={
                        <Typography variant="body2">
                            Don't show again
                        </Typography>
                    }
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
            <StyledDiv>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={props.nextStepAction}
                >
                    {props?.isLastStep ? 'Begin Tour' : 'Next'}
                </Button>
            </StyledDiv>
        </Stack>
    );
};
