import { Button, Stack, Typography } from '@semoss/ui';
import React, { useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
} from '@xyflow/react';

import {
    AppNode,
    CustomEdge,
    LLMNode,
    LLMRunnerNode,
    PromptNode,
    RunPyNode,
    StartEndEdge,
    VectorSearchNode,
} from '@/components/pipeline';

import '@xyflow/react/dist/style.css';
import { TEST_LIST_OF_STEPS } from '@/components/conductor';
import { SerializedState } from '@/stores';

const apps = [
    {
        name: 'Job Req approval',
        question:
            'Hey am i qualified for this job? If so can you approve me or reject me for position',
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
                position: { x: 0, y: 700 },
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
        ],
    },
    {
        name: 'Doc QA',
        question: 'What time are you open and do i need a reservation',
        initialNodes: [
            {
                id: '1',
                position: { x: 0, y: 0 },
                data: {
                    prompt: 'What time are you open and do i need a reservation?',
                },
                type: 'VECTOR_SEARCH',
            },
            {
                id: '2',
                type: 'LLM',
                position: { x: 1000, y: 400 },
                data: {
                    id: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
                    name: 'GPT-40',
                    temperature: 0.2,
                    token_length: 256,
                    top_p: 0.2,
                },
            },
            {
                id: '3',
                type: 'PROMPT',
                position: { x: 1000, y: 0 },
                data: {
                    context: '',
                    prompt: `
                    Answer the user with context from our vector store:
        
                    User: {user_input}
        
                    Answer: 
                    `,
                },
            },
            {
                id: '4',
                type: 'LLM_RUNNER',
                position: { x: 2000, y: 0 },
                data: {
                    modelId: '',
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

const defaultViewport = { x: 50, y: 50, zoom: 0 };

const nodeTypes = {
    APP: AppNode,
    LLM: LLMNode,
    LLM_RUNNER: LLMRunnerNode,
    PROMPT: PromptNode,
    RUN_PY: RunPyNode,
    RUN_PIXEL: RunPyNode,
    VECTOR_SEARCH: VectorSearchNode,
};

const edgeTypes = {
    'start-end': StartEndEdge,
    custom: CustomEdge,
};

type NodeTypes =
    | Node
    | {
          id: string;
          type: 'APP';
          position: { x: number; y: number };
          data: {
              appId: string;
              description: string;
              inputs: string[];
              outputs: string[];
              state: SerializedState;
          };
      }
    | {
          id: string;
          type: 'LLM';
          position: { x: number; y: number };
          data: {
              id: string;
              name: string;
              temperature: number;
              token_length: number;
              top_p: number;
          };
      };

export const PipelinePage = () => {
    const app = apps[1];
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeTypes>(
        app.initialNodes,
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(app.initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const changeEdge = () => {
        console.log(
            'Should i allow changing of edges on UI, or should i automatically connect when they determine a relationship on the node with the input pool',
        );
    };

    const test = () => {
        const newNodes = nodes.map((node) => {
            if (node.id === '1') {
                // it's important that you create a new node object
                // in order to notify react flow about the change
                return {
                    ...node,
                    data: {
                        ...node.data,
                        label: 'new label',
                    },
                };
            }

            return node;
        });
        setNodes(newNodes);
    };

    return (
        <Stack sx={{ height: '100%', overflow: 'scroll' }}>
            <Typography variant={'h6'}>Pipeline Page</Typography>
            <Typography variant={'caption'}>
                {
                    "Should i allow changing of edges on UI, or should i automatically connect when they determine a relationship on the node with the input pool. If i do i'll have to pop open modal saying what input are you trying to connect to"
                }
            </Typography>
            <Button onClick={test}>Update Node</Button>
            <Typography variant={'body1'} fontWeight={'bold'}>
                {app.name}
            </Typography>
            <Typography variant={'body2'} fontWeight={'bold'}>
                {app.question}
            </Typography>
            <Typography variant={'body2'} fontWeight={'bold'}>
                User Inputs in playground: {JSON.stringify(app.requiredInputs)}
            </Typography>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultViewport={defaultViewport}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
            >
                {/* <MiniMap /> */}
                <Controls />
                <Background />
            </ReactFlow>
        </Stack>
    );
};
