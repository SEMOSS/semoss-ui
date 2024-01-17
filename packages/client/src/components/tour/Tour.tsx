import { useEffect, useState } from 'react';
import {
    styled,
    Card,
    IconButton,
    Typography,
    Button,
    Stack,
} from '@semoss/ui';
import { Close } from '@mui/icons-material';
import { TourStep } from './types';

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

interface TourCardProps {
    top: number;
    left: number;
}
const TourCard = styled(Card, {
    shouldForwardProp: (prop) => !['top', 'left'].includes(prop as string),
})<TourCardProps>(({ top, left }) => ({
    zIndex: 102,
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
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
    const [stepTop, setStepTop] = useState<number>(0);
    const [stepLeft, setStepLeft] = useState<number>(0);
    const [stepWidth, setStepWidth] = useState<number>(0);
    const [stepHeight, setStepHeight] = useState<number>(0);
    const [stepCardTop, setStepCardTop] = useState<number>(0);
    const [stepCardLeft, setStepCardLeft] = useState<number>(0);

    useEffect(() => {
        const currentStep = props.steps[currentStepIndex];
        const element = document.querySelector(
            `[data-tour='${currentStep.tourAttr}']`,
        );
        const elementRect = element.getBoundingClientRect();
        setStepTop(elementRect.top - currentStep.highlightPadding);
        setStepLeft(elementRect.left - currentStep.highlightPadding);
        setStepWidth(elementRect.width + currentStep.highlightPadding * 2);
        setStepHeight(elementRect.height + currentStep.highlightPadding * 2);

        const distanceFromElement = 12;
        switch (currentStep.position) {
            case 'right':
                setStepCardTop(elementRect.top - 16);
                setStepCardLeft(elementRect.right + distanceFromElement);
                break;
            case 'bottom':
                setStepCardTop(elementRect.bottom + distanceFromElement);
                setStepCardLeft(elementRect.left - 16);
                break;
        }
    }, [currentStepIndex]);

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

    return (
        <>
            <TourOverlay
                id="tour-overlay"
                top={stepTop}
                left={stepLeft}
                width={stepWidth}
                height={stepHeight}
            />
            <TourClickStop id="tour-click-stop" />
            <TourCard top={stepCardTop} left={stepCardLeft}>
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
        </>
    );
};
