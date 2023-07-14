import { useState } from 'react';
import { styled, Stack, Select, Button, TextArea } from '@semoss/ui';

import {
    NodeComponent,
    NodeConfig,
    NodeParameters,
} from '@/components/pipeline';

const DATABASE_API = [
    {
        id: 1,
        name: 'Movie',
    },
    {
        id: 2,
        name: 'Diabetes',
    },
    {
        id: 3,
        name: 'Actor',
    },
];

const StyledContainer = styled(Stack)(({ theme }) => ({
    position: 'relative',
    width: `${theme.breakpoints.values.sm}px`,
}));

const StyledQuery = styled(TextArea)(() => ({
    height: '250px',
    width: '100%',
}));

interface ImportNodeConfig extends NodeConfig<'import-node'> {
    parameters: {
        FRAME: 'frame';
        DATABASE: 'string';
        QUERY: 'string';
    };
}

export const ImportNode: NodeComponent<ImportNodeConfig> = (props) => {
    const { parameters, saveParameters, closeNode } = props;

    const [database, setDatabase] = useState(parameters.DATABASE.value);
    const [query, setQuery] = useState(parameters.QUERY.value);

    return (
        <StyledContainer>
            <Select
                label="Select Database"
                value={database}
                onChange={(e) => {
                    // set the prompt
                    setDatabase(e.target.value as string);
                }}
            >
                {DATABASE_API.map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                        {p.name}
                    </Select.Item>
                ))}
            </Select>
            <StyledQuery
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            ></StyledQuery>
            <Stack direction={'row'} justifyContent={'flex-end'}>
                <Button
                    variant="contained"
                    onClick={() => {
                        const frame = parameters.FRAME.value.name
                            ? parameters.FRAME
                            : ({
                                  type: 'frame',
                                  value: {
                                      name: `FRAME--${Math.floor(
                                          Math.random() * 10000,
                                      )}`,
                                  },
                              } as NodeParameters['frame']);

                        console.log(frame);

                        saveParameters({
                            FRAME: frame,
                            DATABASE: {
                                type: 'string',
                                value: database,
                            },
                            QUERY: {
                                type: 'string',
                                value: query,
                            },
                        });

                        closeNode(frame.value.name);
                    }}
                >
                    Import
                </Button>
            </Stack>
        </StyledContainer>
    );
};

ImportNode.guid = 'import-node';
ImportNode.config = {
    name: 'Import',
    parameters: {
        FRAME: {
            type: 'frame',
            value: {
                name: '',
            },
        },
        DATABASE: {
            type: 'string',
            value: '',
        },
        QUERY: {
            type: 'string',
            value: '',
        },
    },
    input: [],
    output: ['FRAME'],
};

ImportNode.toPixel = (parameters) => {
    // construct the frame
    const frame = `CreateFrame().as(["${parameters.FRAME.value.name}"])`;

    // embed in the database query
    return `Database(${parameters.DATABASE.value}) | Query() | Import(frame=[${frame}])`;
};
