import { useEffect, useState } from 'react';
import {
    styled,
    Card,
    IconButton,
    Typography,
    Button,
    Stack,
} from '@/component-library';
import { Close } from '@mui/icons-material';
import { TourStep } from './types';
import { Popper } from '@mui/material';

interface TourOverlayProps {
    top: number;
    left: number;
    width: number;
    height: number;
}
const TourOverlay = styled('div', {
    shouldForwardProp: (prop) =>
        !['top', 'left', 'width', 'height'].includes(prop as string),
})<TourOverlayProps>(({ top, left, width, height }) => ({
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    boxShadow: '0 0 0 max(100vw, 100vh) rgba(0, 0, 0, 0.5)',
    zIndex: 100,
}));

const TourClickStop = styled('div')(() => ({
    cursor: 'default!important',
    width: '100vw',
    height: '100vh',
    top: 0,
    left: 0,
    zIndex: 101,
    position: 'absolute',
}));

const TourPopper = styled(Popper)(() => ({
    zIndex: 102,
}));

const TourCard = styled(Card)(() => ({
    position: 'absolute',
    width: '480px',
    '&:hover': {
        boxShadow: 'unset!important',
    },
}));

const TourCardHeader = styled(Card.Header)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.paper,
    margin: 0,
    padding: theme.spacing(2),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.background.paper,
}));

export const Tour = (props: { hideTour: () => void; steps: TourStep[] }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [stepElementHighlight, setStepElementHightlight] = useState<{
        top: number;
        left: number;
        width: number;
        height: number;
    }>({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    });
    const [stepElementAnchor, setStepElementAnchor] =
        useState<HTMLElement>(null);

    const hasStepElement = Boolean(stepElementAnchor);

    const previousStep = () => {
        setCurrentStepIndex(currentStepIndex - 1);
    };
    const nextStep = () => {
        if (currentStepIndex + 1 === props.steps.length) {
            // tour is done
            props.hideTour();
        } else {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };
    const nextStepLabel =
        currentStepIndex + 1 === props.steps.length ? 'Finish' : 'Next';

    useEffect(() => {
        const currentStep = props.steps[currentStepIndex];
        const element = document.querySelector(
            `[data-tour='${currentStep.tourAttr}']`,
        );
        if (element) {
            const elementRect = element.getBoundingClientRect();
            setStepElementHightlight({
                top: elementRect.top - currentStep.highlightPadding,
                left: elementRect.left - currentStep.highlightPadding,
                width: elementRect.width + currentStep.highlightPadding * 2,
                height: elementRect.height + currentStep.highlightPadding * 2,
            });
            setStepElementAnchor(element as HTMLElement);
        } else {
            // there was an issue finding the next step element, try moving on to the next step
            nextStep();
        }
    }, [currentStepIndex]);

    const calculateOffset = (position: 'top' | 'bottom' | 'left' | 'right') => {
        const defaultOffset = 24;
        switch (position) {
            case 'top':
            case 'bottom':
                return [0, defaultOffset];
            case 'right':
            case 'left':
                return [-1 * (stepElementHighlight.height + 8), defaultOffset];
        }
    };

    return (
        <>
            {hasStepElement ? (
                <>
                    <TourOverlay
                        id="tour-overlay"
                        top={stepElementHighlight.top}
                        left={stepElementHighlight.left}
                        width={stepElementHighlight.width}
                        height={stepElementHighlight.height}
                    />
                    <TourClickStop id="tour-click-stop" />
                </>
            ) : (
                <></>
            )}
            <TourPopper
                id="tour-popper"
                key={`tour-step-${currentStepIndex}`}
                placement={props.steps[currentStepIndex].position}
                open={hasStepElement}
                anchorEl={stepElementAnchor}
                modifiers={[
                    {
                        name: 'flip',
                        enabled: true,
                        options: {
                            altBoundary: true,
                            rootBoundary: 'document',
                            padding: 8,
                        },
                    },
                    {
                        name: 'offset',
                        enabled: true,
                        options: {
                            offset: calculateOffset(
                                props.steps[currentStepIndex].position,
                            ),
                        },
                    },
                ]}
            >
                <TourCard>
                    <TourCardHeader
                        action={
                            <StyledIconButton onClick={props.hideTour}>
                                <Close />
                            </StyledIconButton>
                        }
                        title={`${currentStepIndex + 1}/${props.steps.length}`}
                    />
                    <Card.Content>
                        <Stack marginTop="16px">
                            <Typography variant="h6">
                                {props.steps[currentStepIndex].title}
                            </Typography>
                            <Typography variant="body1">
                                {props.steps[currentStepIndex].content}
                            </Typography>
                        </Stack>
                    </Card.Content>
                    <Card.Actions>
                        <Stack
                            direction="row"
                            justifyContent="end"
                            spacing={2}
                            width="100%"
                        >
                            {currentStepIndex === 0 ? (
                                <></>
                            ) : (
                                <Button variant="text" onClick={previousStep}>
                                    Back
                                </Button>
                            )}
                            <Button variant="contained" onClick={nextStep}>
                                {nextStepLabel}
                            </Button>
                        </Stack>
                    </Card.Actions>
                </TourCard>
            </TourPopper>
        </>
    );
};
