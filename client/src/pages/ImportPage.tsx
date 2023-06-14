import { useState } from 'react';
import { styled, Stepper } from '@semoss/components';
import { observer } from 'mobx-react-lite';

import { theme } from '@/theme';
import { Page } from '@/components/ui';
import { REGISTRY, Step, StepConfig } from '@/components/import';

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.lg,
    width: '100%',
    maxWidth: '50%',
});

const StyledTitleGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['4'],
});

const ImportTitleWrapper = styled('div', {
    width: theme.space['72'],
});
const StyledTitle = styled('h1', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.semibold,
});

const StyledImport = styled('div', {
    display: 'flex',
    gap: theme.space['4'],
});

const StyledStepper = styled('div', {
    flexShrink: '0',
    width: theme.space['72'],
});

export const ImportPage = observer((): JSX.Element => {
    const [selectedStep, setSelectedStep] = useState<number>(0);
    const [steps, setSteps] = useState<Step<StepConfig>[]>([
        {
            id: 'landing',
            name: 'Landing',
            data: {
                type: '',
            },
        },
    ]);

    // get the information related to the step
    const step = steps[selectedStep];

    // get the component
    const Component = REGISTRY[step.id];

    // ignore if the step is missing or the component is not there
    if (!step || !Component) {
        return <></>;
    }

    return (
        <Page
            header={
                <StyledTitleGroup>
                    <ImportTitleWrapper>
                        <StyledTitle>Data Catalog</StyledTitle>
                    </ImportTitleWrapper>
                    <StyledDescription>{step.name}</StyledDescription>
                </StyledTitleGroup>
            }
        >
            <StyledImport>
                <StyledStepper>
                    <Stepper layout="vertical" value={`${selectedStep}`}>
                        {steps.map((s, sIdx) => {
                            return (
                                <Stepper.Step
                                    key={`${s.id}-${s.name}`}
                                    value={`${sIdx}`}
                                >
                                    {s.name}
                                </Stepper.Step>
                            );
                        })}
                    </Stepper>
                </StyledStepper>
                <Component
                    stepIdx={selectedStep}
                    step={steps[selectedStep]}
                    updateStep={(options) => {
                        // update the specific steps
                        const updated = steps.map((s, sIdx) =>
                            selectedStep === sIdx ? { ...s, ...options } : s,
                        );

                        // update the steps in the store
                        setSteps(updated);

                        // return the updated steps
                        return updated;
                    }}
                    navigateStep={(sIdx) => setSelectedStep(sIdx)}
                    steps={steps}
                    updateSteps={(updated) => {
                        // update the steps in the store
                        setSteps(updated);

                        // return the updated steps
                        return updated;
                    }}
                />
            </StyledImport>
        </Page>
    );
});
