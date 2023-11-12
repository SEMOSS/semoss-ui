import { useEffect, useState } from 'react';
import { Builder, Token } from '../prompt.types';
import { StyledStepPaper } from '../prompt.styled';
import { Autocomplete } from '@mui/material';
import { Box, Grid, TextField, Typography } from '@semoss/ui';
import {
    TOKEN_TYPE_INPUT,
    INPUT_TYPES,
    INPUT_TYPE_DISPLAY,
} from '../prompt.constants';
import { PromptGeneratorReadonlyInputToken } from '../PromptGeneratorToken';

function InputSelection(props: {
    inputToken: Token;
    inputType: string | null;
    setInputType: (inputTokenIndex: number, inputType: string) => void;
}) {
    return (
        <Grid
            sx={{
                justifyContent: 'space-between',
                alignItem: 'center',
                marginY: 2,
            }}
            container
            direction="row"
        >
            <Grid item>
                <PromptGeneratorReadonlyInputToken token={props.inputToken} />
            </Grid>
            <Grid item xs={8} md={4}>
                <Autocomplete
                    disableClearable
                    id="input-token-autocomplete"
                    options={INPUT_TYPES}
                    value={props.inputType}
                    getOptionLabel={(option) => INPUT_TYPE_DISPLAY[option]}
                    onChange={(_, newInputType: string) => {
                        props.setInputType(
                            props.inputToken.index,
                            newInputType,
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Input Type"
                            variant="standard"
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
}

export function PromptGeneratorBuilderInputTypeStep(props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: object) => void;
}) {
    const [inputTokens, setInputTokens] = useState([]);
    const [inputTypes, setInputTypes] = useState({});
    const setInputType = (inputTokenIndex: number, inputType: string) => {
        setInputTypes((state) => ({
            ...state,
            [inputTokenIndex]: inputType,
        }));
    };

    useEffect(() => {
        const tokens = [...(props.builder.inputs.value as Token[])];
        const filteredTokens = tokens.filter(
            (token) =>
                token.type === TOKEN_TYPE_INPUT &&
                !token.isHiddenPhraseInputToken,
        );
        setInputTokens(filteredTokens);
        const keyedInputs = filteredTokens.reduce((acc, token: Token) => {
            return { ...acc, [token.index]: null };
        }, {});
        setInputTypes(keyedInputs);
    }, []);

    useEffect(() => {
        if (
            Object.values(inputTypes).length &&
            Object.values(inputTypes).every((inputType) => !!inputType)
        ) {
            props.setBuilderValue('inputTypes', inputTypes);
        }
    }, [inputTypes]);

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Define Input Types</Typography>
                <Typography variant="body1">
                    Use the dropdowns to define the input types for each of your
                    inputs.
                </Typography>
            </Box>
            {Array.from(inputTokens, (inputToken: Token) => (
                <InputSelection
                    inputToken={inputToken}
                    inputType={inputTypes[inputToken.index]}
                    key={inputToken.index}
                    setInputType={setInputType}
                />
            ))}
        </StyledStepPaper>
    );
}
