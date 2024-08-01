import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setBlocksAndOpenUIBuilder } from '../prompt.helpers';
import {
    Builder,
    BuilderStepItem,
    ConstraintSettings,
    Token,
} from '../prompt.types';
import {
    PROMPT_BUILDER_CONTEXT_STEP,
    PROMPT_BUILDER_INPUTS_STEP,
    PROMPT_BUILDER_INPUT_TYPES_STEP,
    PROMPT_BUILDER_CONSTRAINTS_STEP,
    PROMPT_BUILDER_PREVIEW_STEP,
    TOKEN_TYPE_INPUT,
    INPUT_TYPE_VECTOR,
    INPUT_TYPE_DATABASE,
} from '../prompt.constants';
import { styled, Box, Button, Grid, Paper, useNotification } from '@semoss/ui';
import { PromptBuilderSummary } from './summary';
import { useRootStore } from '@/hooks';
import { PromptBuilderStep } from './step';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: `${theme.spacing(1)} 0`,
    height: '100%',
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(4),
    gap: theme.spacing(1),
}));

const initialBuilder: Builder = {
    title: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: undefined,
        required: true,
        display: 'Name',
    },
    tags: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: [],
        required: false,
        display: 'Tags',
    },
    model: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: undefined,
        required: true,
        display: 'LLM',
    },
    context: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: undefined,
        required: true,
        display: 'Context',
    },
    inputs: {
        step: PROMPT_BUILDER_INPUTS_STEP,
        value: undefined,
        required: false,
        display: 'Input',
    },
    inputTypes: {
        step: PROMPT_BUILDER_INPUT_TYPES_STEP,
        value: undefined,
        required: true,
        display: 'Input Types',
    },
    constraints: {
        step: PROMPT_BUILDER_CONSTRAINTS_STEP,
        value: undefined,
        required: true,
        display: 'Constraints',
    },
};

export const PromptBuilder = () => {
    const { monolithStore } = useRootStore();
    const [builder, setBuilder] = useState<Builder>(initialBuilder);
    const [currentBuilderStep, changeBuilderStep] = useState<number>(1);
    const [createAppLoading, setCreateAppLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const notification = useNotification();

    const setBuilderValue = (
        builderStepKey: string,
        value: string | Token[] | ConstraintSettings | object,
    ) => {
        setBuilder((state) => ({
            ...state,
            [builderStepKey]: { ...state[builderStepKey], value: value },
        }));
    };

    const nextButtonText =
        currentBuilderStep < PROMPT_BUILDER_CONSTRAINTS_STEP
            ? 'Next'
            : currentBuilderStep === PROMPT_BUILDER_CONSTRAINTS_STEP
            ? 'Preview'
            : 'Create App';

    // adds explanation to error message if input types are not set properly
    const checkForInputTypesSkipped = (errorMessage) => {
        if (
            errorMessage ===
            "Cannot read properties of undefined (reading 'type')"
        ) {
            return `${errorMessage}. Please define input types.`;
        } else {
            return errorMessage;
        }
    };

    const nextButtonAction = async () => {
        if (currentBuilderStep === PROMPT_BUILDER_PREVIEW_STEP) {
            setCreateAppLoading(true);
            // prompt flow finished, move on
            try {
                await setBlocksAndOpenUIBuilder(
                    builder,
                    monolithStore,
                    navigate,
                );
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: checkForInputTypesSkipped(e.message),
                });
                setCreateAppLoading(false);
            }
        } else if (currentBuilderStep === PROMPT_BUILDER_INPUTS_STEP) {
            // skip input types step if no inputs configured
            const hasInputs = (builder.inputs.value as Token[]).some(
                (token: Token) => {
                    return token.type === TOKEN_TYPE_INPUT;
                },
            );

            if (!hasInputs) {
                setBuilderValue('inputTypes', {});
            }
            changeBuilderStep(currentBuilderStep + (hasInputs ? 1 : 2));
        } else {
            changeBuilderStep(currentBuilderStep + 1);
        }
    };

    const backButtonAction = () => {
        if (currentBuilderStep === PROMPT_BUILDER_INPUT_TYPES_STEP + 1) {
            // moving back from step after input types step - if no input types, skip that step moving backwards
            const hasInputs = (builder.inputs.value as Token[]).some(
                (token: Token) => {
                    return token.type === TOKEN_TYPE_INPUT;
                },
            );
            changeBuilderStep(currentBuilderStep - (hasInputs ? 1 : 2));
        } else {
            changeBuilderStep(currentBuilderStep - 1);
        }
    };

    // this seemed to be causing skipping to step 1 when trying to navigate back to step 3
    // using changeBuilderStep instead for now to address bug, not sure if we need this
    const navigateBuilderSteps = (step: number) => {
        if (step === PROMPT_BUILDER_INPUT_TYPES_STEP) {
            // moving back from step after input types step - if no input types, skip that step moving backwards
            const hasInputs = (builder.inputs.value as Token[]).some(
                (token: Token) => {
                    return token.type === TOKEN_TYPE_INPUT;
                },
            );
            changeBuilderStep(currentBuilderStep - (hasInputs ? 1 : 2));
        } else {
            changeBuilderStep(step);
        }
    };

    const isBuilderStepComplete = (step: number) => {
        const stepItems = Object.values(builder).filter(
            (builderStepItem: BuilderStepItem) => {
                return (
                    builderStepItem.step === step &&
                    (builderStepItem.required || !builderStepItem.value)
                );
            },
        );
        switch (step) {
            case PROMPT_BUILDER_INPUT_TYPES_STEP:
                // input type step - required only if there are inputs
                if (stepItems[0].value === undefined) {
                    return false;
                }
                // if there are inputs, make sure we have types for all
                // and types that require extra info have the extra info
                return (
                    Object.values(stepItems[0].value).length &&
                    Object.values(stepItems[0].value).every(
                        (inputType: { type: string; meta: string }) => {
                            if (
                                inputType?.type === INPUT_TYPE_VECTOR ||
                                inputType?.type === INPUT_TYPE_DATABASE
                            ) {
                                return !!inputType.meta;
                            } else {
                                return !!inputType.type;
                            }
                        },
                    )
                );
            default:
                return stepItems.every((builderStepItem: BuilderStepItem) => {
                    return !builderStepItem.value
                        ? !!builderStepItem.value
                        : true;
                });
        }
    };

    const isBuildStepsComplete = () => {
        let completed = true;
        Object.values(builder).forEach((obj) => {
            if (!obj.value) {
                completed = false;
            }
        });
        return completed;
    };

    return (
        <>
            <Grid container>
                <Grid item xs={3}>
                    <StyledPaper elevation={2}>
                        <PromptBuilderSummary
                            builder={builder}
                            currentBuilderStep={currentBuilderStep}
                            isBuilderStepComplete={isBuilderStepComplete}
                            isBuildStepsComplete={isBuildStepsComplete}
                            // using this instead of navigateBuilderSteps seems to haved desired behavior
                            // had to add seperate handling for disabling Input Types step
                            changeBuilderStep={changeBuilderStep}
                        />
                    </StyledPaper>
                </Grid>
                <Grid item xs={9}>
                    <PromptBuilderStep
                        builder={builder}
                        currentBuilderStep={currentBuilderStep}
                        setBuilderValue={setBuilderValue}
                    />
                </Grid>
            </Grid>
            <StyledBox>
                {currentBuilderStep === PROMPT_BUILDER_CONTEXT_STEP ? (
                    <></>
                ) : (
                    <Button
                        color="primary"
                        variant="text"
                        onClick={backButtonAction}
                    >
                        Back
                    </Button>
                )}
                <Button
                    color="primary"
                    disabled={!isBuilderStepComplete(currentBuilderStep)}
                    variant="contained"
                    onClick={nextButtonAction}
                    loading={createAppLoading}
                >
                    {nextButtonText}
                </Button>
            </StyledBox>
        </>
    );
};
