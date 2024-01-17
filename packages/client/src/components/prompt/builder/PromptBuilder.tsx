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
import { styled, Box, Button, Grid, Paper } from '@semoss/ui';
import { PromptBuilderSummary } from './summary';
import { useRootStore } from '@/hooks';
import { PromptBuilderStep } from './step';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    paddingBottom: 0,
    margin: theme.spacing(1),
    height: '100%',
    maxHeight: '100%',
    overflow: 'scroll',
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(4),
}));

const initialBuilder: Builder = {
    title: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: undefined,
        required: true,
        display: 'Title',
    },
    tags: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: undefined,
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

    const nextButtonAction = () => {
        if (currentBuilderStep === PROMPT_BUILDER_PREVIEW_STEP) {
            setCreateAppLoading(true);
            // prompt flow finished, move on
            setBlocksAndOpenUIBuilder(builder, monolithStore, navigate);
        } else if (currentBuilderStep === PROMPT_BUILDER_INPUTS_STEP) {
            // skip input types step if no inputs configured
            const hasInputs = (builder.inputs.value as Token[]).some(
                (token: Token) => {
                    return token.type === TOKEN_TYPE_INPUT;
                },
            );
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

    const isBuilderStepComplete = (step: number) => {
        const stepItems = Object.values(builder).filter(
            (builderStepItem: BuilderStepItem) => {
                return (
                    builderStepItem.step === step && builderStepItem.required
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
                    return builderStepItem.required
                        ? !!builderStepItem.value
                        : true;
                });
        }
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
                        sx={{ marginRight: '8px' }}
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
