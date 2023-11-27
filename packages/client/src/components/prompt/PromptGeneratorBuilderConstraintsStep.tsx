import { useEffect, useState } from 'react';
import { Builder, ConstraintSettings } from './prompt.types';
import { StyledStepPaper } from './prompt.styled';
import {
    styled,
    Box,
    Stack,
    Switch,
    SwitchProps,
    Typography,
} from '@mui/material';

interface Constraint {
    title: string;
    description: string;
    key: string;
}
type Constraints = Constraint[];
const inputConstraints: Constraints = [
    {
        title: 'Restrict user input to dropdown options',
        description: 'Provide a list of options for user to select from',
        key: 'restrictInput',
    },
];
const outputConstraints: Constraints = [
    {
        title: 'Filter hate speech',
        description: 'Filter words with negative connotations',
        key: 'filterHateSpeech',
    },
    {
        title: 'Limit response to 100 words',
        description: 'Enforce a word limit to elicit a concise response',
        key: 'limitResponseWords',
    },
    {
        title: 'Limit response to 150 characters',
        description:
            'Enforce a character count limit to elicit a concise response',
        key: 'limitResponseCharacters',
    },
    {
        title: 'Set tone of voice',
        description:
            'Select a tone of voice to give responses a specific inflection or personality',
        key: 'setTone',
    },
    {
        title: 'Use bullet points',
        description: 'Formulate responses in bullet point form',
        key: 'bulletpoints',
    },
];
const initialConstraintSettings: ConstraintSettings = {
    restrictInput: false,
    filterHateSpeech: true,
    limitResponseWords: true,
    limitResponseCharacters: false,
    setTone: false,
    bulletpoints: false,
};

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    '&:not(:last-child)': {
        marginBottom: theme.spacing(2),
    },
}));

const StyledSwitch = styled((props: SwitchProps) => (
    <Switch
        focusVisibleClassName=".Mui-focusVisible"
        disableRipple
        {...props}
    />
))(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color:
                theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 22,
        height: 22,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));

function PromptGeneratorConstraint(props: {
    constraint: Constraint;
    constraintSettings: ConstraintSettings;
    setBuilderValue: (
        builderStepKey: string,
        value: ConstraintSettings,
    ) => void;
    toggleConstraintSetting: (constraintKey: string) => void;
}) {
    return (
        <StyledBox>
            <StyledSwitch
                value={props.constraintSettings[props.constraint.key]}
                defaultChecked={props.constraintSettings[props.constraint.key]}
                onChange={(e) => {
                    props.toggleConstraintSetting(props.constraint.key);
                    props.setBuilderValue(
                        'constraints',
                        props.constraintSettings,
                    );
                }}
            />
            <Stack direction="column" ml="12px">
                <Typography variant="body1">
                    {props.constraint.title}
                </Typography>
                <Typography variant="body2">
                    {props.constraint.description}
                </Typography>
            </Stack>
        </StyledBox>
    );
}

export function PromptGeneratorBuilderConstraintsStep(props: {
    builder: Builder;
    setBuilderValue: (
        builderStepKey: string,
        value: ConstraintSettings,
    ) => void;
}) {
    const [constraintSettings, setConstraintSettings] = useState(
        initialConstraintSettings,
    );
    const toggleConstraintSetting = (constraintKey: string) => {
        setConstraintSettings((state) => ({
            ...state,
            [constraintKey]: {
                ...state[constraintKey],
                value: !state[constraintKey].value,
            },
        }));
    };
    useEffect(() => {
        props.setBuilderValue('constraints', constraintSettings);
    }, []);

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Set Constraints</Typography>
                <Typography>
                    Add constraints or rules to your prompt to help the LLM
                    tailor a response based on specific requirements
                </Typography>
            </Box>
            <StyledStack direction="column">
                <Typography variant="h6">Input Constraints</Typography>
                {Array.from(
                    Object.values(inputConstraints),
                    (constraint: Constraint, i) => (
                        <PromptGeneratorConstraint
                            key={constraint.key}
                            constraint={constraint}
                            constraintSettings={constraintSettings}
                            setBuilderValue={props.setBuilderValue}
                            toggleConstraintSetting={toggleConstraintSetting}
                        />
                    ),
                )}
                <Typography variant="h6">Ouput Constraints</Typography>
                {Array.from(
                    Object.values(outputConstraints),
                    (constraint: Constraint, i) => (
                        <PromptGeneratorConstraint
                            key={constraint.key}
                            constraint={constraint}
                            constraintSettings={constraintSettings}
                            setBuilderValue={props.setBuilderValue}
                            toggleConstraintSetting={toggleConstraintSetting}
                        />
                    ),
                )}
            </StyledStack>
        </StyledStepPaper>
    );
}
