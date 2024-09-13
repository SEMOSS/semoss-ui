import { Button, Stack, Tooltip, Typography } from '@semoss/ui';
import React, { useState } from 'react';

import { Pipeline, Playground } from '@/components/pipeline';

import '@xyflow/react/dist/style.css';
import { TEST_LIST_OF_STEPS } from '@/components/conductor';
import { ConductorContext } from '@/contexts';
import { ConductorStore } from '@/stores';

const apps = [
    {
        name: 'Job Req approval',
        question: 'Hey am i qualified for this job?',
        requiredInputs: ['name'],
        initialNodes: [
            { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
            { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
            {
                id: '5',
                type: 'APP',
                position: { x: 1000, y: 0 },
                data: {
                    appId: 'test-1',
                    description:
                        'Gets the position and retrieves a list of skills that come back for the inputted job',
                    inputs: [
                        'name',
                        'job-title',
                        'model-to-use',
                        'phone-number',
                        'email',
                        'address',
                    ],
                    outputs: ['list-of-skills'],
                    state: TEST_LIST_OF_STEPS[0],
                },
            },
            {
                id: '6',
                type: 'APP',
                position: { x: 2000, y: 500 },
                data: {
                    appId: 'test-2',
                    description:
                        'Takes a list of skills for a position, and determines if there is a match. Outputs yes or no',
                    inputs: [
                        'model-to-use',
                        'skill-1',
                        'skill-2',
                        'list-of-skills',
                    ],
                    outputs: ['is-qualified'],
                    state: TEST_LIST_OF_STEPS[1],
                },
            },
            {
                id: '7',
                type: 'APP',
                position: { x: 3000, y: 0 },
                data: {
                    appId: 'test-3',
                    description:
                        'Writes a rejection/approval letter based on if user is qualified',
                    inputs: [
                        'model-to-use',
                        'is-qualified',
                        'name',
                        'phone-number',
                        'address',
                        'email',
                        'company-name',
                        'supervisor-name',
                        'supervisor-phone',
                        'supervisor-email',
                    ],
                    outputs: ['email-letter'],
                    state: TEST_LIST_OF_STEPS[2],
                },
            },
            {
                id: '3',
                type: 'LLM',
                position: { x: 0, y: 1000 },
                data: {
                    id: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
                    name: 'GPT-40',
                    temperature: 0.2,
                    token_length: 256,
                    top_p: 0.2,
                },
            },
            {
                id: '4',
                type: 'PROMPT',
                position: { x: 0, y: 250 },
                data: {
                    context: '',
                    prompt: `
                    Answer the user with the context of all three apps:
        
                    User: {user_input}
        
                    Answer: 
                    `,
                },
            },
            {
                id: '8',
                type: 'LLM_RUNNER',
                position: { x: 800, y: 800 },
                data: {
                    modelId: '',
                },
            },
        ],
        initialEdges: [
            { id: 'edge-1-2', source: '1', target: '2' },
            {
                id: 'edge-5-6--0',
                source: '5',
                target: '6',
                sourceHandle: `app-${'test-1'}-source-${'list-of-skills'}`,
                targetHandle: `app-${'test-2'}-target-${'list-of-skills'}`,
                data: {
                    label: 'list-of-skills',
                },
                type: 'start-end',
            },
            {
                id: 'edge-5-7--0',
                source: '5',
                target: '7',
                sourceHandle: `app-${'test-1'}-source-${'model-to-use'}`,
                targetHandle: `app-${'test-3'}-target-${'model-to-use'}`,
                data: {
                    label: 'model-to-use',
                },
                type: 'start-end',
            },
            {
                id: 'edge-5-7--1',
                source: '5',
                target: '7',
                sourceHandle: `app-${'test-1'}-source-${'name'}`,
                targetHandle: `app-${'test-3'}-target-${'name'}`,
                data: {
                    label: 'name',
                },
                type: 'start-end',
            },
            {
                id: 'edge-5-7--2',
                source: '5',
                target: '7',
                sourceHandle: `app-${'test-1'}-source-${'phone-number'}`,
                targetHandle: `app-${'test-3'}-target-${'phone-number'}`,
                data: {
                    label: 'phone-number',
                },
                type: 'start-end',
            },
            {
                id: 'edge-5-7--3',
                source: '5',
                target: '7',
                sourceHandle: `app-${'test-1'}-source-${'email'}`,
                targetHandle: `app-${'test-3'}-target-${'email'}`,
                data: {
                    label: 'email',
                },
                type: 'start-end',
            },
            {
                id: 'edge-5-7--4',
                source: '5',
                target: '7',
                sourceHandle: `app-${'test-1'}-source-${'address'}`,
                targetHandle: `app-${'test-3'}-target-${'address'}`,
                data: {
                    label: 'address',
                },
                type: 'start-end',
            },
            {
                id: 'edge-6-7',
                source: '6',
                target: '7',
                sourceHandle: `app-${'test-2'}-source-${'is-qualified'}`,
                targetHandle: `app-${'test-3'}-target-${'is-qualified'}`,
                data: {
                    label: 'is-qualified',
                },
                type: 'start-end',
            },

            {
                id: 'edge-6-7',
                source: '6',
                target: '7',
                sourceHandle: `app-${'test-2'}-source-${'is-qualified'}`,
                targetHandle: `app-${'test-3'}-target-${'is-qualified'}`,
                data: {
                    label: 'is-qualified',
                },
                type: 'start-end',
            },
            {
                id: 'edge-3-8',
                source: '3',
                target: '8',
                sourceHandle: `llm-${'3'}-source-${'model'}`,
                targetHandle: `llm-runner-${'8'}-target-${'model'}`,
                data: {
                    label: 'model id',
                },
                type: 'start-end',
            },
            {
                id: 'edge-4-8',
                source: '4',
                target: '8',
                sourceHandle: `prompt-${'4'}-source-${'prompt'}`,
                targetHandle: `llm-runner-${'8'}-target-${'prompt'}`,
                data: {
                    label: 'prompt',
                },
                type: 'start-end',
            },
            // {
            //     id: 'edge-6-4',
            //     source: '6',
            //     target: '4',
            //     sourceHandle: `app-${'6'}-source-${'is-qualified'}`,
            //     targetHandle: `prompt-${'4'}-target-${'context'}`,
            //     data: {
            //         label: 'context',
            //     },
            //     type: 'start-end',
            // },
        ],
    },
    {
        name: 'Doc QA',
        // question: 'What time are you open and do i need a reservation?',
        question: 'I would like to set up a reservation for 9:45',
        initialNodes: [
            {
                id: '9',
                position: { x: 0, y: 0 },
                data: {
                    command: '{{chat_input}}',

                    output: 'vector-search-records',
                },
                type: 'BUTTON',
            },
            {
                id: '10',
                position: { x: 0, y: 200 },
                data: {
                    value: 'chat input',

                    output: 'vector-search-records',
                },
                type: 'INPUT',
            },
            {
                id: '1',
                position: { x: 300, y: 0 },
                data: {
                    engine: '2df38ed6-ace0-4fd6-9abb-e095fb49940e',
                    command: '{{chat_input}}',

                    output: 'vector-search-records',
                },
                type: 'VECTOR_SEARCH',
            },
            {
                id: '2',
                type: 'LLM',
                position: { x: 1000, y: 700 },
                data: {
                    engine_id: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
                    name: 'GPT-40',
                    temperature: 0.2,
                    token_length: 256,
                    top_p: 0.2,

                    output: '',
                },
            },
            {
                id: '3',
                type: 'PROMPT',
                position: { x: 1000, y: 0 },
                data: {
                    context:
                        'Answer the user with context from our vector store {{vector_search_node}}:',
                    prompt: `User: {{chat_input}}
Answer: 
                    `,

                    output: '',
                },
            },
            {
                id: '4',
                type: 'LLM_RUNNER',
                position: { x: 2000, y: 0 },
                data: {
                    engine_id: '',
                    param_values: {
                        temperature: 0.2,
                        token_length: 256,
                        top_p: 0.2,
                    },
                    prompt: '',

                    output: '',
                },
            },
        ],
        initialEdges: [
            {
                id: 'edge-1-3',
                source: '1',
                target: '3',
                sourceHandle: `vector-${'1'}-source-${'context'}`,
                targetHandle: `prompt-${'3'}-target-${'context'}`,
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: 'edge-2-4',
                source: '2',
                target: '4',
                sourceHandle: `llm-${'2'}-source-${'model'}`,
                targetHandle: `llm-runner-${'4'}-target-${'model'}`,
                data: {
                    label: 'model id',
                },
                type: 'start-end',
            },
            {
                id: 'edge-3-4',
                source: '3',
                target: '4',
                sourceHandle: `prompt-${'3'}-source-${'prompt'}`,
                targetHandle: `llm-runner-${'4'}-target-${'prompt'}`,
                data: {
                    label: 'prompt',
                },
                type: 'start-end',
            },
        ],
    },
];

export const PipelinePage = () => {
    const [view, setView] = useState<'pipeline' | 'playground'>('playground');
    const [selectedApp, setSelectedApp] = useState(1);
    const app = apps[selectedApp];

    const conductor = new ConductorStore({
        chat_input: app.question,
        nodes: app.initialNodes,
        edges: app.initialEdges,
    });

    return (
        <ConductorContext.Provider value={{ conductor: conductor }}>
            <Stack sx={{ height: '10%' }} direction={'column'}>
                <Stack direction="row" gap={1}>
                    <Typography variant={'h6'}>
                        {view === 'pipeline' ? 'Pipeline' : 'Playground'}
                    </Typography>
                    <Button
                        onClick={() => {
                            if (view === 'pipeline') {
                                setView('playground');
                            } else {
                                setView('pipeline');
                            }
                        }}
                    >
                        Show {view === 'pipeline' ? 'Playground' : 'Pipeline'}
                    </Button>
                </Stack>

                <Stack direction={'row'} gap={2}>
                    <Typography variant={'body1'} fontWeight={'bold'}>
                        {app.name}{' '}
                        <Tooltip
                            title={
                                <Stack>
                                    <Typography variant={'body2'}>
                                        {
                                            "Should i allow changing of edges on UI, or should i automatically connect when they determine a relationship on the node with the input pool. If i do i'll have to pop open modal saying what input are you trying to connect to"
                                        }
                                    </Typography>
                                    <Typography variant={'caption'}>
                                        User Inputs in playground:{' '}
                                        {JSON.stringify(app.requiredInputs)}
                                    </Typography>
                                </Stack>
                            }
                        >
                            <Button>Notes</Button>
                        </Tooltip>
                    </Typography>
                    <Button
                        onClick={() => {
                            setSelectedApp(selectedApp === 1 ? 0 : 1);
                        }}
                    >
                        switch
                    </Button>
                </Stack>
            </Stack>
            <Stack sx={{ height: '90%' }}>
                {view === 'pipeline' ? <Pipeline /> : <Playground />}
            </Stack>
        </ConductorContext.Provider>
    );
};
