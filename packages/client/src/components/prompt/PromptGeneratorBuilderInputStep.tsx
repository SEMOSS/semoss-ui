import { useEffect, useState } from 'react';
import { TOKEN_TYPE_TEXT, TOKEN_TYPE_INPUT } from './prompt.constants';
import { Builder, Token } from './prompt.types';
import { StyledStepPaper, StyledTextPaper } from './prompt.styled';
import { Box, Typography } from '@mui/material';
import { PromptGeneratorSetToken } from './PromptGeneratorToken';

export function PromptGeneratorBuilderInputStep(props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: Token[]) => void;
}) {
    // Tokens (words) in context
    const [tokens, setTokens] = useState({});
    // Tokens in input, necessary to accomodate multiple word inputs
    const [selectedInputTokens, setSelectedInputTokens] = useState([]);

    /**
     * Split context into tokens by word
     */
    useEffect(() => {
        const tokenArray =
            props.builder.context.value &&
            typeof props.builder.context.value === 'string'
                ? props.builder.context.value.split(' ')
                : [];
        const tokenObjectArray = tokenArray.map((token, index) => {
            const value = token.replace(/\W/g, '');
            const tokenObject: Token = {
                index: index,
                key: value,
                display: token,
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            };
            return tokenObject;
        });
        const initialTokens = tokenObjectArray.reduce((acc, currToken) => {
            acc[currToken.index] = currToken;
            return acc;
        }, {});
        setTokens(initialTokens);
    }, []);
    /**
     * Change the token type
     * @param tokenIndex
     */
    const setTokenType = (tokenIndex: number, tokenType: string) => {
        setTokens((state) => {
            const newTokens = {
                ...state,
                [tokenIndex]: {
                    ...state[tokenIndex],
                    type: tokenType,
                },
            };
            return newTokens;
        });
    };
    /**
     * Change the token value and display, used to handle merged tokens
     * @param tokenIndex
     * @param tokenValue
     */
    const setTokenDisplay = (tokenIndex: number, tokenDisplay: string) => {
        setTokens((state) => {
            const value = tokenDisplay.replace(/[\W_]+/g, ' ').trim();
            const newTokens = {
                ...state,
                [tokenIndex]: {
                    ...state[tokenIndex],
                    display: tokenDisplay,
                    key: value,
                    value: value,
                },
            };
            return newTokens;
        });
    };
    /**
     * Used the hide/unhide tokens that were merged
     * @param tokenIndex
     * @param hideToken
     */
    const setHideToken = (tokenIndex: number, hideToken: boolean) => {
        setTokens((state) => {
            const newTokens = {
                ...state,
                [tokenIndex]: {
                    ...state[tokenIndex],
                    isHiddenPhraseInputToken: hideToken,
                },
            };
            return newTokens;
        });
    };
    /**
     * Add new token to selections
     * If the new token is directly before or after existing tokens, it's consecutive and part of the same input
     * Otherwise, remove the token from the selected inputs
     * @param tokenIndex
     */
    const addSelectedInputToken = (tokenIndex: number) => {
        const selectedInputTokensCopy = [...selectedInputTokens];
        const sortedTokens = selectedInputTokensCopy.sort((a, b) => a - b);
        let isConsecutive = false;
        // is consecutive if key is one less than first item or one more than last item
        if (
            sortedTokens[0] - 1 === tokenIndex ||
            sortedTokens[sortedTokens.length - 1] + 1 === tokenIndex
        ) {
            isConsecutive = true;
        }
        if (isConsecutive) {
            setSelectedInputTokens([...selectedInputTokens, tokenIndex]);
        } else {
            setSelectedInputTokens([tokenIndex]);
        }
    };
    /**
     * Remove tokens from selection
     * If the removal makes the selections non-consecutive, reset
     * @param tokenIndex
     */
    const removeSelectedInputToken = (tokenIndex: number) => {
        const selectedInputTokensCopy = [...selectedInputTokens];
        const index = selectedInputTokensCopy.indexOf(tokenIndex);
        // item is not the first or last item, make the selections no longer consectutive
        if (
            index > 0 &&
            (index !== 0 || index !== selectedInputTokens.length - 1)
        ) {
            // reset the value on the phrase input to a single word
            if (selectedInputTokensCopy.length > 1) {
                const originalWord = tokens[tokenIndex].value.split(' ')[0];
                setTokenDisplay(selectedInputTokensCopy[0].key, originalWord);
            }
            setSelectedInputTokens([]);
        } else if (index === 0 && selectedInputTokens.length) {
            // token is first item on phrase
            selectedInputTokensCopy.shift();
            setSelectedInputTokens(selectedInputTokensCopy);
            setTokenType(tokenIndex, TOKEN_TYPE_TEXT);
        } else if (
            index === selectedInputTokens.length - 1 &&
            selectedInputTokens.length
        ) {
            // token is last item on phrase
            selectedInputTokensCopy.pop();
            setSelectedInputTokens(selectedInputTokensCopy);
            setTokenType(tokenIndex, TOKEN_TYPE_TEXT);
        } else {
            // resetting input to text
            setTokenType(tokenIndex, TOKEN_TYPE_TEXT);
        }
    };
    /**
     * Reset input types tokens to be text type
     * Reset phrase display if needed
     * @param tokenIndex
     */
    const resetInputToken = (tokenIndex: number) => {
        const phrase = tokens[tokenIndex].display;
        const phraseArray = phrase.split(' ');
        if (phrase.length === 1) {
            setTokenType(tokenIndex, TOKEN_TYPE_TEXT);
        } else {
            // the input was a multi-word phrase
            const firstWord = phraseArray.shift();
            setTokenDisplay(tokenIndex, firstWord);
            setTokenType(tokenIndex, TOKEN_TYPE_TEXT);
            // un-hide the hidden values
            for (let index = 1; index < phraseArray.length + 1; index++) {
                setTokenType(tokenIndex + index, TOKEN_TYPE_TEXT);
                setHideToken(tokenIndex + index, false);
            }
        }
    };
    /**
     * Everything selected should become an input token
     * Multi-word inputs should be merged
     */
    const setSelectedTokensAsInputs = () => {
        if (selectedInputTokens.length > 1) {
            const selectedInputTokensCopy = [...selectedInputTokens];
            selectedInputTokensCopy.sort((a, b) => a - b);
            const newTokenValue = selectedInputTokensCopy
                .reduce(
                    (accumulator, currentKey) =>
                        `${accumulator} ${tokens[currentKey].display}`,
                    '',
                )
                .trim();
            selectedInputTokensCopy.forEach(
                (selectedInputTokenIndex, selectedArrayIndex) => {
                    if (selectedArrayIndex === 0) {
                        // set the new token value/display for the phrase input
                        setTokenDisplay(selectedInputTokenIndex, newTokenValue);
                    } else {
                        // hide the rest of the tokens in the phrase
                        setHideToken(selectedInputTokenIndex, true);
                    }
                    setTokenType(selectedInputTokenIndex, TOKEN_TYPE_INPUT);
                },
            );
        } else {
            setTokenType(selectedInputTokens[0], TOKEN_TYPE_INPUT);
        }
        setSelectedInputTokens([]);
    };
    // Update main builder state when tokens update
    useEffect(() => {
        props.setBuilderValue('inputs', Object.values(tokens));
    }, [tokens]);
    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Set Inputs</Typography>
                <Typography>
                    Click on a word or consecutive words to set it as a
                    user-defined input. Click a defined input to deselect it.
                </Typography>
            </Box>
            <StyledTextPaper elevation={0}>
                {Array.from(Object.values(tokens), (token: Token) => (
                    <PromptGeneratorSetToken
                        key={token.index}
                        token={token}
                        selectedInputTokens={selectedInputTokens}
                        addSelectedInputToken={addSelectedInputToken}
                        removeSelectedInputToken={removeSelectedInputToken}
                        resetInputToken={resetInputToken}
                        setSelectedTokensAsInputs={setSelectedTokensAsInputs}
                    />
                ))}
            </StyledTextPaper>
        </StyledStepPaper>
    );
}
