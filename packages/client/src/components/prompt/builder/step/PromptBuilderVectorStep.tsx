import { useEffect, useMemo, useState } from 'react';
import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper } from '../../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { PromptBuilderVectorSearchSelection } from './PromptBuilderVectorSearchSelection';
import { usePixel } from '@/hooks';
import {
    TOKEN_TYPE_INPUT,
    VECTOR_SEARCH_CUSTOM,
    VECTOR_SEARCH_FULL_CONTEXT,
    VECTOR_SEARCH_INPUT,
} from '../../prompt.constants';
import { getIdForInput, getInputFormatPrompt } from '../../prompt.helpers';

export const PromptBuilderVectorStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: object) => void;
}) => {
    const [vectorStatements, setVectorStatements] = useState({});
    const setVectorStatement = (vectorId: string, statement: string) => {
        setVectorStatements((state) => ({
            ...state,
            [vectorId]: statement,
        }));
    };

    // options for vector search statement - full, input, or custom
    const searchOptions: Array<{
        display: string;
        value: string;
        type: string;
    }> = useMemo(() => {
        let options = [
            {
                display: 'Full Context',
                type: VECTOR_SEARCH_FULL_CONTEXT,
                value: getInputFormatPrompt(
                    props.builder.inputs.value as Token[],
                    props.builder.inputTypes.value as object,
                ),
            },
        ];
        (props.builder.inputs.value as Token[]).forEach((token) => {
            if (
                token.type === TOKEN_TYPE_INPUT &&
                !token.isHiddenPhraseInputToken &&
                !token.linkedInputToken
            ) {
                options.push({
                    display: token.key,
                    type: `${VECTOR_SEARCH_INPUT}_${token.key}`,
                    value: `{{${getIdForInput(
                        props.builder.inputTypes.value[
                            token.linkedInputToken ?? token.index
                        ],
                        token.linkedInputToken ?? token.index,
                    )}.value}}`,
                });
            }
        });
        options.push({
            display: 'Custom',
            type: VECTOR_SEARCH_CUSTOM,
            value: '',
        });
        return options;
    }, [props.builder.inputs]);

    // vector db IDs selected in context step (step 1)
    const selectedVectors = useMemo(() => {
        return [...(props.builder.vector.value as string[])];
    }, [props.builder.vector]);

    // set statement type to full context by default
    useEffect(() => {
        setVectorStatements(
            selectedVectors.reduce((acc, krId) => {
                return {
                    ...acc,
                    [krId]: getInputFormatPrompt(
                        props.builder.inputs.value as Token[],
                        props.builder.inputTypes.value as object,
                    ),
                };
            }, {}),
        );
    }, [selectedVectors]);

    // update builder tracked value
    useEffect(() => {
        props.setBuilderValue('vectorSearchStatements', vectorStatements);
    }, [vectorStatements]);

    const myVectorDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['VECTOR']);`,
    );
    const vectorDisplay = useMemo(() => {
        if (myVectorDbs.status !== 'SUCCESS') {
            return;
        }

        return myVectorDbs.data.reduce((acc, vector) => {
            return { ...acc, [vector.app_id]: vector.app_name };
        }, {});
    }, [myVectorDbs.status, myVectorDbs.data]);

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">
                    Refine Knowledge Repository Search
                </Typography>
                <Typography variant="body1">
                    Use the dropdowns to refine the search statements to be used
                    with each Knowledge Repository.
                </Typography>
            </Box>
            {Array.from(selectedVectors, (vectorId: string) => (
                <PromptBuilderVectorSearchSelection
                    key={vectorId}
                    vectorDisplay={vectorDisplay ? vectorDisplay[vectorId] : ''}
                    searchOptions={searchOptions}
                    searchStatement={vectorStatements[vectorId]}
                    setSearchStatement={(statement: string) =>
                        setVectorStatement(vectorId, statement)
                    }
                />
            ))}
        </StyledStepPaper>
    );
};
