import { useEffect, useMemo, useState } from 'react';
import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper } from '../../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { PromptBuilderVectorSearchSelection } from './PromptBuilderVectorSearchSelection';
import { usePixel } from '@/hooks';
import { TOKEN_TYPE_INPUT } from '../../prompt.constants';
import { getIdForInput } from '../../prompt.helpers';

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

    const searchOptions = useMemo(() => {
        let options = [
            {
                display: 'Full Context',
                value: '',
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
                    value: `{{${getIdForInput(
                        props.builder.inputTypes.value[
                            token.linkedInputToken ?? token.index
                        ],
                        token.linkedInputToken ?? token.index,
                    )}}}`,
                });
            }
        });
        return options;
    }, [props.builder.inputs]);

    const knowledgeRepositories = useMemo(() => {
        return [...(props.builder.vector.value as string[])];
    }, [props.builder.vector]);

    useEffect(() => {
        setVectorStatements(
            knowledgeRepositories.reduce((acc, krId) => {
                return { ...acc, [krId]: '' };
            }, {}),
        );
    }, [knowledgeRepositories]);

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
                    Use the dropdowns to define the search statements to be used
                    with each Knowledge Repository.
                </Typography>
            </Box>
            {Array.from(knowledgeRepositories, (vectorId: string) => (
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
