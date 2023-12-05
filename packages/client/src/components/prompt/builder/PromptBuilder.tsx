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
    // PROMPT_BUILDER_CONSTRAINTS_STEP,
    PROMPT_BUILDER_PREVIEW_STEP,
    TOKEN_TYPE_INPUT,
} from '../prompt.constants';
import { styled, Box, Button, Grid, Paper } from '@semoss/ui';
// import { PromptBuilderConstraintsStep } from './PromptBuilderConstraintsStep';
import { PromptBuilderSummary } from './summary';
import { useRootStore } from '@/hooks';
import { PromptBuilderStep } from './step';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    margin: theme.spacing(1),
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
    vector: {
        step: PROMPT_BUILDER_CONTEXT_STEP,
        value: undefined,
        required: false,
        display: 'Knowledge Repository',
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
    // constraints: {
    //     step: PROMPT_BUILDER_CONSTRAINTS_STEP,
    //     value: undefined,
    //     required: true,
    //     display: 'Constraints',
    // },
};

export const PromptBuilder = () => {
    const { monolithStore } = useRootStore();
    const [builder, setBuilder] = useState(initialBuilder);
    const [currentBuilderStep, changeBuilderStep] = useState(1);
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
        currentBuilderStep < PROMPT_BUILDER_INPUT_TYPES_STEP
            ? 'Next'
            : currentBuilderStep === PROMPT_BUILDER_INPUT_TYPES_STEP
            ? 'Preview'
            : 'Create App';

    const nextButtonAction = () => {
        if (currentBuilderStep === PROMPT_BUILDER_PREVIEW_STEP) {
            // prompt flow finished, move on
            setBlocksAndOpenUIBuilder(builder, monolithStore, navigate);
        } else if (currentBuilderStep === 2) {
            // skip input types step if not inputs configured
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
        if (currentBuilderStep === PROMPT_BUILDER_PREVIEW_STEP) {
            // moving back from preview step - if no input types, skip that step moving backwards
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
                return (
                    Object.values(stepItems[0].value).length &&
                    Object.values(stepItems[0].value).every(
                        (type: string | null) => {
                            return !!type;
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
                >
                    {nextButtonText}
                </Button>
            </StyledBox>
        </>
    );
};
