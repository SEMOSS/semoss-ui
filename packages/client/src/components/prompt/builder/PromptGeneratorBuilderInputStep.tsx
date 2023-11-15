import React, { useEffect, useState } from 'react';
import { TOKEN_TYPE_TEXT, TOKEN_TYPE_INPUT } from '../prompt.constants';
import { Builder, Token } from '../prompt.types';
import { StyledStepPaper, StyledTextPaper } from '../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { PromptGeneratorSetToken } from '../PromptGeneratorToken';

export function PromptGeneratorBuilderInputStep(props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: Token[]) => void;
}) {
    const [tokens, setTokens] = useState<Token[]>([]);
    // Tokens in input, necessary to accomodate multiple word inputs
    const [selectedInputTokens, setSelectedInputTokens] = useState([]);

    useEffect(() => {
        props.setBuilderValue('inputs', tokens);
    }, [tokens]);

    /**
     * Split context into tokens by word
     */
    useEffect(() => {
        const contextString =
            props.builder.context.value &&
            typeof props.builder.context.value === 'string'
                ? props.builder.context.value.replace('\n', '\n ')
                : '';
        // split by space except for what's in double brackets
        const tokenArray = contextString.match(
            /(?:[^\s\{\{\}\}]+|\{\{[^\{\{\}\}]*\}\})+/g,
        );
        let preconfiguredInputs = {};
        let tokenObjectArray: Token[] = [];
        tokenArray.forEach((token) => {
            let tokenObjectArrayIndex = tokenObjectArray.length;
            if (token.match(/(\{\{.+?\}\})/g)?.length > 0) {
                const inputToken = token.replace('{{', '').replace('}}', ''); // preserve punctuation outside braces
                const fullTokenValue = inputToken.replace(
                    /[.,\/#!$%\^&\*;:{}=\-_`~()]/g,
                    '',
                );
                if (!preconfiguredInputs.hasOwnProperty(fullTokenValue)) {
                    preconfiguredInputs[fullTokenValue] = tokenObjectArrayIndex;
                }
                inputToken.split(' ').forEach((tokenWord, i) => {
                    let tokenObject: Token;
                    if (i === 0) {
                        tokenObject = {
                            index: tokenObjectArrayIndex,
                            key: fullTokenValue,
                            display: inputToken,
                            type: TOKEN_TYPE_INPUT,
                            isHiddenPhraseInputToken: false,
                            linkedInputToken:
                                preconfiguredInputs[fullTokenValue] ??
                                undefined,
                        };
                    } else {
                        tokenObject = {
                            index: tokenObjectArrayIndex,
                            key: tokenWord.replace(
                                /[.,\/#!$%\^&\*;:{}=\-_`~()]/g,
                                '',
                            ),
                            display: tokenWord,
                            type: TOKEN_TYPE_INPUT,
                            isHiddenPhraseInputToken: true,
                            linkedInputToken:
                                preconfiguredInputs[fullTokenValue] ??
                                undefined,
                        };
                    }
                    tokenObjectArray.push(tokenObject);
                    tokenObjectArrayIndex++;
                });
            } else {
                const value = token.replace(/\W/g, '');
                const tokenObject: Token = {
                    index: tokenObjectArrayIndex,
                    key: value,
                    display: token,
                    type: TOKEN_TYPE_TEXT,
                    isHiddenPhraseInputToken: false,
                    linkedInputToken: undefined,
                };
                tokenObjectArray.push(tokenObject);
            }
        });
        setTokens(tokenObjectArray);
    }, []);
    /**
     * Change the token type
     * @param tokenIndex
     */
    const setTokenType = (tokenIndex: number, tokenType: string) => {
        setTokens((previousState) => {
            let newTokens = [...previousState];
            let indexToken = newTokens[tokenIndex];
            newTokens[tokenIndex] = {
                ...indexToken,
                type: tokenType,
                linkedInputToken: undefined,
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
        setTokens((previousState) => {
            const value = tokenDisplay.replace(/[\W_]+/g, ' ').trim();
            let newTokens = [...previousState];
            newTokens[tokenIndex] = {
                ...newTokens[tokenIndex],
                display: tokenDisplay,
                key: value,
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
        setTokens((previousState) => {
            let newTokens = [...previousState];
            newTokens[tokenIndex] = {
                ...newTokens[tokenIndex],
                isHiddenPhraseInputToken: hideToken,
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
        if (index !== 0 && index !== selectedInputTokens.length - 1) {
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

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Set Inputs</Typography>
                <Typography variant="body1">
                    Click on a word or consecutive words to set it as a
                    user-defined input. Click a defined input to deselect it.
                </Typography>
            </Box>
            <StyledTextPaper>
                {Array.from(tokens, (token: Token) => (
                    <React.Fragment key={token.index}>
                        <PromptGeneratorSetToken
                            token={token}
                            selectedInputTokens={selectedInputTokens}
                            addSelectedInputToken={addSelectedInputToken}
                            removeSelectedInputToken={removeSelectedInputToken}
                            resetInputToken={resetInputToken}
                            setSelectedTokensAsInputs={
                                setSelectedTokensAsInputs
                            }
                        />
                        {token.display.endsWith('\n') ? (
                            <div style={{ flex: 1 }} />
                        ) : (
                            <></>
                        )}
                    </React.Fragment>
                ))}
            </StyledTextPaper>
        </StyledStepPaper>
    );
}
