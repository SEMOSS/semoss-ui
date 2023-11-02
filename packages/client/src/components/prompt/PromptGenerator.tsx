import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const QUERIES: Record<string, Query> = {
    'query-1': {
        id: 'query-1',
        isInitialized: false,
        isLoading: false,
        error: null,
        query: `LLM(engine=["f5f7fd76-a3e5-4dba-8cbb-ededf0f612b4"], command=["<encode>{{input-3.value}}</encode>"]);`,
        data: undefined,
        mode: 'manual',
    },
};
const BLOCKS: Record<string, Block> = {
    'page-1': {
        id: 'page-1',
        widget: 'page',
        parent: null,
        data: {
            style: {
                fontFamily: 'serif',
            },
        },
        listeners: {},
        slots: {
            content: {
                name: 'content',
                children: ['container-1'],
            },
        },
    },
    'container-1': {
        id: 'container-1',
        widget: 'container',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                background: 'white',
                boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
                flexDirection: 'column',
                gap: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
            },
        },
        listeners: {},
        slots: {
            children: {
                name: 'children',
                children: [
                    'text-1',
                    'text-2',
                    'input-3',
                    'text-4',
                    'text-5',
                    'button-6',
                    'text-8',
                ],
            },
        },
    },
    'text-1': {
        id: 'text-1',
        widget: 'text-field',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            label: 'Example',
            value: '',
        },
        listeners: {},
        slots: {},
    },
    'text-2': {
        id: 'text-2',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontSize: '1.25rem',
            },
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        },
        listeners: {},
        slots: {},
    },
    'input-3': {
        id: 'input-3',
        widget: 'input',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
            },
            value: '',
        },
        listeners: {
            onChange: [],
        },
        slots: {},
    },
    'text-4': {
        id: 'text-4',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontWeight: 'bold',
            },
            text: 'Answer:',
        },
        listeners: {},
        slots: {},
    },
    'text-5': {
        id: 'text-5',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
            },
            text: '{{input-3.value}}',
        },
        listeners: {},
        slots: {},
    },
    'button-6': {
        id: 'button-6',
        widget: 'button',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                padding: '16px',
                background: 'lightblue',
            },
        },
        listeners: {
            onClick: [
                {
                    message: ActionMessages.RUN_QUERY,
                    payload: {
                        id: 'query-1',
                    },
                },
            ],
        },
        slots: {
            text: {
                name: 'text',
                children: ['text-7'],
            },
        },
    },
    'text-7': {
        id: 'text-7',
        widget: 'text',
        parent: {
            id: 'button-6',
            slot: 'text',
        },
        data: {
            style: {
                display: 'block',
            },
            text: 'Submit',
        },
        listeners: {},
        slots: {},
    },
    'text-8': {
        id: 'text-8',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontSize: '1.125rem',
            },
            text: '{{query-1.data.response}}',
        },
        listeners: {},
        slots: {},
    },
};

// TODO: transform the prompt into meaningful blocks and queries and set them in the store here
// This is just using the blocks above as a proof of concept of store functionality
function setBlocksAndOpenBuilder(
    navigate: (route: string) => void,
    onSuccess: () => void,
) {
    StateStore.dispatch({
        message: ActionMessages.SET_STATE,
        payload: {
            blocks: BLOCKS,
            queries: QUERIES,
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
            ? setBlocksAndOpenBuilder(navigate, props.onSuccess)
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
