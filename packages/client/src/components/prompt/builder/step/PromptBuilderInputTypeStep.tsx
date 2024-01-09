import { useEffect, useState, useMemo } from 'react';
import { Builder, Token } from '../../prompt.types';
// import { StyledStepPaper } from '../../prompt.styled';
import { styled, Box, Paper, Stack, Typography } from '@semoss/ui';
import { INPUT_TYPE_TEXT, TOKEN_TYPE_INPUT } from '../../prompt.constants';
import { PromptBuilderInputTypeSelection } from './PromptBuilderInputTypeSelection';
import { usePixel } from '@/hooks';

export const StyledStepPaper = styled(Paper)(({ theme }) => ({
    margin: theme.spacing(1),
    height: '100%',
}));

export const StyledBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4),
    paddingButton: theme.spacing(2),
}));

export const StyledStack = styled(Stack)(({ theme }) => ({
    padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
    maxHeight: '480px',
    overflowY: 'scroll',
}));

export const PromptBuilderInputTypeStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: object) => void;
}) => {
    const [inputTokens, setInputTokens] = useState([]);
    const [inputTypes, setInputTypes] = useState({});
    const setInputType = (
        inputTokenIndex: number,
        inputType: string,
        inputTypeMeta: string | null,
    ) => {
        setInputTypes((state) => ({
            ...state,
            [inputTokenIndex]: {
                type: inputType,
                meta: inputTypeMeta,
            },
        }));
    };

    const [cfgLibraryVectorDbs, setCfgLibraryVectorDbs] = useState({
        loading: false,
        ids: [],
        display: {},
    });

    const myVectorDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['VECTOR']);`,
    );
    useMemo(() => {
        if (myVectorDbs.status !== 'SUCCESS') {
            return;
        }

        let vectorDbIds: string[] = [];
        let vectorDbDisplay = {};
        myVectorDbs.data.forEach((vector) => {
            vectorDbIds.push(vector.app_id);
            vectorDbDisplay[vector.app_id] = vector.app_name;
        });
        setCfgLibraryVectorDbs({
            loading: false,
            ids: vectorDbIds,
            display: vectorDbDisplay,
        });
    }, [myVectorDbs.status, myVectorDbs.data]);

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
            return {
                ...acc,
                [token.index]: { type: INPUT_TYPE_TEXT, meta: null },
            };
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
            <StyledBox>
                <Typography variant="h5">Define Input Types</Typography>
                <Typography variant="body1">
                    Use the dropdowns to define the input types for each of your
                    inputs.
                </Typography>
            </StyledBox>
            <StyledStack spacing={3}>
                {Array.from(inputTokens, (inputToken: Token) => (
                    <PromptBuilderInputTypeSelection
                        inputToken={inputToken}
                        inputType={inputTypes[inputToken.index].type}
                        inputTypeMeta={inputTypes[inputToken.index].meta}
                        key={inputToken.index}
                        cfgLibraryVectorDbs={cfgLibraryVectorDbs}
                        setInputType={setInputType}
                    />
                ))}
            </StyledStack>
        </StyledStepPaper>
    );
};
