import { useMemo, useState } from 'react';
import { Breadcrumbs, Icon, Stack, Typography, styled } from '@semoss/ui';

import { Page, LoadingScreen } from '@/components/ui';
import { ArrowBack } from '@mui/icons-material';
import { Outlet, Link } from 'react-router-dom';
import { StepperContext, StepperContextType } from '@/contexts';

const StyledLink = styled(Link)(({ theme }) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const AddAppLayout = (props) => {
    const [isLoading, setIsLoading] =
        useState<StepperContextType['isLoading']>(false);

    const [internalSteps, setInternalSteps] = useState<
        StepperContextType['steps']
    >([]);

    const [internalActiveStepIdx, setInternalActiveStepIdx] =
        useState<StepperContextType['activeStepIdx']>(-1);

    /**
     * Get the active step
     */
    const activeStep = useMemo(() => {
        if (
            internalActiveStepIdx !== -1 &&
            internalSteps[internalActiveStepIdx]
        ) {
            return internalSteps[internalActiveStepIdx];
        }

        return null;
    }, [internalSteps, internalActiveStepIdx]);

    /**
     * Update the steps in the flow
     *
     * step - step to add
     * activeStepIdx - new step idx
     */
    const setSteps: StepperContextType['setSteps'] = (
        updatedSteps,
        updatedActiveStepIdx,
    ) => {
        // set the step
        setInternalSteps(updatedSteps);

        // navigate if open
        if (updatedActiveStepIdx) {
            setInternalActiveStepIdx(updatedActiveStepIdx);
        }
    };

    /**
     * Set the new active step
     *
     * activeStepIdx - new step idx
     */
    const setActiveStep: StepperContextType['setActiveStep'] = (
        updatedActiveStepIdx,
    ) => {
        setInternalActiveStepIdx(updatedActiveStepIdx);
    };

    return (
        <StepperContext.Provider
            value={{
                isLoading: isLoading,
                steps: internalSteps,
                activeStepIdx: internalActiveStepIdx,
                activeStep: activeStep,
                setSteps: setSteps,
                setActiveStep: setActiveStep,
                setIsLoading: setIsLoading,
            }}
        >
            <Page
                header={
                    <Stack>
                        <Breadcrumbs>
                            {!internalSteps.length ? (
                                <StyledLink to={`..`}>App Library</StyledLink>
                            ) : null}
                            <StyledLink
                                to={`.`}
                                onClick={() => {
                                    setSteps([], -1);
                                }}
                            >
                                {internalSteps.length ? (
                                    <Icon>
                                        <ArrowBack />
                                    </Icon>
                                ) : null}
                                Create App
                            </StyledLink>
                        </Breadcrumbs>
                        <Typography variant="h4">
                            {!internalSteps.length
                                ? 'Create App'
                                : activeStep.title}
                        </Typography>
                        <Typography variant="body1">
                            {!internalSteps.length
                                ? 'Select a template, import an existing app, or create a new app'
                                : activeStep.description}
                        </Typography>
                    </Stack>
                }
            >
                {isLoading && <LoadingScreen.Trigger />}
                <Outlet />
            </Page>
        </StepperContext.Provider>
    );
};
