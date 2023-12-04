import { useEffect, useState } from 'react';
import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper } from '../../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { TOKEN_TYPE_INPUT } from '../../prompt.constants';
import { PromptBuilderInputTypeSelection } from './PromptBuilderInputTypeSelection';

export const PromptBuilderInputTypeStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: object) => void;
}) => {
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
                !token.isHiddenPhraseInputToken &&
                (token.linkedInputToken !== undefined
                    ? token.index === token.linkedInputToken
                    : true),
        );
        setInputTokens(filteredTokens);
        const keyedInputs = filteredTokens.reduce((acc, token: Token) => {
            return { ...acc, [token.index]: null };
        }, {});
        setInputTypes(keyedInputs);
    }, []);

    useEffect(() => {
        if (Object.values(inputTypes).every((inputType) => !!inputType)) {
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
                <PromptBuilderInputTypeSelection
                    inputToken={inputToken}
                    inputType={inputTypes[inputToken.index]}
                    key={inputToken.index}
                    setInputType={setInputType}
                />
            ))}
        </StyledStepPaper>
    );
};
