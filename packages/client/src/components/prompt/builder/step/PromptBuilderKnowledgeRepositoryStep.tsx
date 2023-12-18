import { useEffect, useMemo, useState } from 'react';
import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper } from '../../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { PromptBuilderKnowledgeRepositorySearchSelection } from './PromptBuilderKnowledgeRepositorySearchSelection';
import { usePixel } from '@/hooks';

export const PromptBuilderKnowledgeRepositoryStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: object) => void;
}) => {
    const [knowledgeRepositoryStatements, setKnowledgeRepositoryStatements] =
        useState({});
    const setKnowledgeRepositoryStatement = (
        knowledgeRepositoryId: string,
        statement: string,
    ) => {
        setKnowledgeRepositoryStatements((state) => ({
            ...state,
            [knowledgeRepositoryId]: statement,
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
            if (!token.isHiddenPhraseInputToken && !token.linkedInputToken) {
                options.push({
                    display: token.display,
                    value: `{{${token.key}}}`,
                });
            }
        });
        return options;
    }, [props.builder.inputs]);

    const knowledgeRepositories = useMemo(() => {
        return [...(props.builder.vector.value as string[])];
    }, [props.builder.vector]);

    useEffect(() => {
        setKnowledgeRepositoryStatements(
            knowledgeRepositories.reduce((acc, krId) => {
                return { ...acc, [krId]: '' };
            }, {}),
        );
    }, [knowledgeRepositories]);

    useEffect(() => {
        props.setBuilderValue(
            'knowledgeRepositorySearchStatements',
            knowledgeRepositoryStatements,
        );
    }, [knowledgeRepositoryStatements]);

    const myVectorDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['VECTOR']);`,
    );
    const knowledgeRepositoryDisplay = useMemo(() => {
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
            {Array.from(
                knowledgeRepositories,
                (knowledgeRepositoryId: string) => (
                    <PromptBuilderKnowledgeRepositorySearchSelection
                        key={knowledgeRepositoryId}
                        knowledgeRepositoryDisplay={
                            knowledgeRepositoryDisplay
                                ? knowledgeRepositoryDisplay[
                                      knowledgeRepositoryId
                                  ]
                                : ''
                        }
                        searchOptions={searchOptions}
                        searchStatement={
                            knowledgeRepositoryStatements[knowledgeRepositoryId]
                        }
                        setSearchStatement={(statement: string) =>
                            setKnowledgeRepositoryStatement(
                                knowledgeRepositoryId,
                                statement,
                            )
                        }
                    />
                ),
            )}
        </StyledStepPaper>
    );
};
