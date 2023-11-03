import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getBlockForInput,
    getQueryForPrompt,
    PROMPT_BASE_BLOCKS,
    PROMPT_CONTAINER_BLOCK_ID,
} from './prompt.helpers';
import {
    Builder,
    BuilderStepItem,
    ConstraintSettings,
    Token,
} from './prompt.types';
import { ActionMessages, Block, Query, StateStore } from '@/stores';
import { styled, Box, Button, Grid, Paper } from '@mui/material';
import { PromptGeneratorBuilderConstraintsStep } from './PromptGeneratorBuilderConstraintsStep';
import { PromptGeneratorBuilderInputStep } from './PromptGeneratorBuilderInputStep';
import { PromptGeneratorBuilderInputTypeStep } from './PromptGeneratorBuilderInputTypeStep';
import { PromptGeneratorBuilderPreviewStep } from './PromptGeneratorBuilderPreviewStep';
import { PromptGeneratorBuilderPromptStep } from './PromptGeneratorBuilderPromptStep';
import { PromptGeneratorBuilderSummary } from './PromptGeneratorBuilderSummary';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    margin: theme.spacing(1),
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginRight: theme.spacing(1),
}));

const initialBuilder: Builder = {
    context: {
        step: 1,
        value: undefined,
        required: true,
        display: 'Context',
    },
    inputs: {
        step: 2,
        value: undefined,
        required: false,
        display: 'Input',
    },
    inputTypes: {
        step: 3,
        value: undefined,
        required: true,
        display: 'Input Types',
    },
    constraints: {
        step: 4,
        value: undefined,
        required: true,
        display: 'Constraints',
    },
};

function setBlocksAndOpenBuilder(
    builder: Builder,
    navigate: (route: string) => void,
    onSuccess: () => void,
) {
    // base page
    let blocks: Record<string, Block> = { ...PROMPT_BASE_BLOCKS };
    // inputs
    let childInputIds = [];
    for (const [tokenIndex, inputType] of Object.entries(
        builder.inputTypes.value as object,
    )) {
        const token = builder.inputs.value[tokenIndex] as Token;
        const inputBlock = getBlockForInput(token, inputType);
        if (!!inputBlock) {
            childInputIds = [...childInputIds, inputBlock.id];
            blocks = { ...blocks, [inputBlock.id]: inputBlock };
        }
    }
    // submit
    blocks[PROMPT_CONTAINER_BLOCK_ID].slots.children.children = [
        ...childInputIds,
        ...blocks[PROMPT_CONTAINER_BLOCK_ID].slots.children.children,
    ];
    StateStore.dispatch({
        message: ActionMessages.SET_STATE,
        payload: {
            blocks: blocks,
            queries: getQueryForPrompt(
                builder.inputs.value as Token[],
                builder.inputTypes.value as object,
            ),
        },
    });
    onSuccess(); // This doesn't have meaningful content yet, but adding as placeholder
    navigate('/edit/design');
}

function BuilderStep(props: {
    builder: Builder;
    currentBuilderStep: number;
    setBuilderValue: (
        builderStepKey: string,
        value: string | Token[] | ConstraintSettings | object,
    ) => void;
}) {
    switch (props.currentBuilderStep) {
        case 1:
            return <PromptGeneratorBuilderPromptStep {...props} />;
        case 2:
            return <PromptGeneratorBuilderInputStep {...props} />;
        case 3:
            return <PromptGeneratorBuilderInputTypeStep {...props} />;
        case 4:
            return <PromptGeneratorBuilderConstraintsStep {...props} />;
        case 5:
            return <PromptGeneratorBuilderPreviewStep {...props} />;
        default:
            return <StyledPaper elevation={2} square />;
    }
}

export function PromptGenerator(props: { onSuccess: () => void }) {
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

    const isCurrentBuilderStepComplete = () => {
        return Object.values(builder)
            .filter((builderStepItem: BuilderStepItem) => {
                return (
                    builderStepItem.step === currentBuilderStep &&
                    builderStepItem.required
                );
            })
            .every((builderStepItem: BuilderStepItem) => {
                return !!builderStepItem.value;
            });
    };

    const nextButtonText =
        currentBuilderStep < 4
            ? 'Next'
            : currentBuilderStep === 4
            ? 'Preview'
            : 'Open in Builder';

    const nextButtonAction = () => {
        currentBuilderStep === 5
            ? setBlocksAndOpenBuilder(builder, navigate, props.onSuccess)
            : changeBuilderStep(currentBuilderStep + 1);
    };

    return (
        <>
            <Grid container sx={{ height: '100%' }}>
                <Grid item xs={3}>
                    <StyledPaper elevation={2}>
                        <PromptGeneratorBuilderSummary
                            builder={builder}
                            currentBuilderStep={currentBuilderStep}
                        />
                    </StyledPaper>
                </Grid>
                <Grid item xs={9}>
                    <BuilderStep
                        builder={builder}
                        currentBuilderStep={currentBuilderStep}
                        setBuilderValue={setBuilderValue}
                    />
                </Grid>
            </Grid>
            <StyledBox>
                {currentBuilderStep === 1 ? (
                    <></>
                ) : (
                    <Button
                        color="primary"
                        variant="text"
                        sx={{ marginRight: '8px' }}
                        onClick={() =>
                            changeBuilderStep(currentBuilderStep - 1)
                        }
                    >
                        Back
                    </Button>
                )}
                <Button
                    color="primary"
                    disabled={!isCurrentBuilderStepComplete()}
                    variant="contained"
                    onClick={() => nextButtonAction()}
                >
                    {nextButtonText}
                </Button>
            </StyledBox>
        </>
    );
}
