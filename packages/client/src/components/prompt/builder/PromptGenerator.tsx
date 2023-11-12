import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setBlocksAndOpenUIBuilder } from '../prompt.helpers';
import {
    Builder,
    BuilderStepItem,
    ConstraintSettings,
    Token,
} from '../prompt.types';
import { TOKEN_TYPE_INPUT } from '../prompt.constants';
import { styled, Box, Button, Grid, Paper } from '@semoss/ui';
// import { PromptGeneratorBuilderConstraintsStep } from './PromptGeneratorBuilderConstraintsStep';
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
    marginTop: theme.spacing(4),
}));

const initialBuilder: Builder = {
    title: {
        step: 1,
        value: undefined,
        required: true,
        display: 'Title',
    },
    tags: {
        step: 1,
        value: undefined,
        required: false,
        display: 'Tags',
    },
    model: {
        step: 1,
        value: undefined,
        required: true,
        display: 'LLM',
    },
    context: {
        step: 1,
        value: undefined,
        required: true,
        display: 'Context',
    },
    inputs: {
        step: 2,
        value: undefined,
        required: true,
        display: 'Input',
    },
    inputTypes: {
        step: 3,
        value: undefined,
        required: true,
        display: 'Input Types',
    },
    // constraints: {
    //     step: 4,
    //     value: undefined,
    //     required: true,
    //     display: 'Constraints',
    // },
};

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
        // case 4:
        //     return <PromptGeneratorBuilderConstraintsStep {...props} />;
        case 4:
            return <PromptGeneratorBuilderPreviewStep {...props} />;
        default:
            return <StyledPaper elevation={2} square />;
    }
}

export function PromptGenerator() {
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
        currentBuilderStep < 3
            ? 'Next'
            : currentBuilderStep === 3
            ? 'Preview'
            : 'Open in Builder';

    const nextButtonAction = () => {
        currentBuilderStep === 4
            ? setBlocksAndOpenUIBuilder(builder, navigate)
            : changeBuilderStep(currentBuilderStep + 1);
    };

    const isCurrentBuilderStepComplete = () => {
        const stepItems = Object.values(builder).filter(
            (builderStepItem: BuilderStepItem) => {
                return (
                    builderStepItem.step === currentBuilderStep &&
                    builderStepItem.required
                );
            },
        );
        switch (currentBuilderStep) {
            case 2:
                // input step - need at least one input
                if (!stepItems[0].value) {
                    return false;
                }
                return stepItems[0].value.some((token: Token) => {
                    return token.type === TOKEN_TYPE_INPUT;
                });
            case 3:
                // input type step - types should not be null
                if (!stepItems[0].value) {
                    return false;
                }
                return Object.values(stepItems[0].value).every(
                    (type: string | null) => {
                        return !!type;
                    },
                );
            default:
                return stepItems.every((builderStepItem: BuilderStepItem) => {
                    return !!builderStepItem.value;
                });
        }
    };

    return (
        <>
            <Grid container>
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
