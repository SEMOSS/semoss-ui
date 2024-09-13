import React, { useCallback, useState } from 'react';
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
    Accordion,
    Button,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
    styled,
} from '@semoss/ui';

import {
    AppNode,
    ButtonNode,
    CustomEdge,
    InputNode,
    LLMNode,
    LLMRunnerNode,
    PromptNode,
    RunPyNode,
    StartEndEdge,
    VectorSearchNode,
} from '@/components/pipeline';

import { SerializedState } from '@/stores';
import { ChevronRight, Mic, Send } from '@mui/icons-material';
import { useConductor } from '@/hooks';

import '@xyflow/react/dist/style.css';
import { observer } from 'mobx-react-lite';

const nodeTypes = {
    APP: AppNode,
    BUTTON: ButtonNode,
    INPUT: InputNode,
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

const defaultViewport = { x: 50, y: 50, zoom: 0 };

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

export const Pipeline = observer(() => {
    const { conductor } = useConductor();

    // debugger
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeTypes>(
        conductor.nodes,
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(conductor.edges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const test = (e) => {
        e.preventDefault();
        e.stopPropagation();

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
            <Stack direction={'column'} sx={{ height: '100%' }}>
                <Typography variant={'body2'} fontWeight={'bold'}>
                    {conductor.chat_input}
                </Typography>
                <Grid container sx={{ height: '100%' }}>
                    <Grid item xs={2.5}>
                        <Stack direction={'column'}>
                            <Typography variant={'h6'}>
                                Core Components
                            </Typography>
                            <Accordion>
                                <Accordion.Trigger
                                    expandIcon={<ChevronRight />}
                                >
                                    Apps
                                </Accordion.Trigger>
                                <Accordion.Content>
                                    <Stack direction="column" gap={1}>
                                        <Typography variant="caption">
                                            App 1
                                        </Typography>
                                    </Stack>
                                </Accordion.Content>
                            </Accordion>
                            <Accordion>
                                <Accordion.Trigger
                                    expandIcon={<ChevronRight />}
                                >
                                    RAG
                                </Accordion.Trigger>
                                <Accordion.Content>
                                    <Stack direction="column" gap={1}>
                                        <Typography variant={'caption'}>
                                            Vector Store 1
                                        </Typography>
                                        <Typography variant={'caption'}>
                                            Vector Store 2
                                        </Typography>
                                    </Stack>
                                </Accordion.Content>
                            </Accordion>
                            <Accordion>
                                <Accordion.Trigger
                                    expandIcon={<ChevronRight />}
                                >
                                    Python
                                </Accordion.Trigger>
                                <Accordion.Content>
                                    <Stack direction="column" gap={1}>
                                        <Typography variant={'caption'}>
                                            Run Py
                                        </Typography>
                                        <Typography variant={'caption'}>
                                            Py package 2
                                        </Typography>
                                    </Stack>
                                </Accordion.Content>
                            </Accordion>
                            <Accordion>
                                <Accordion.Trigger
                                    expandIcon={<ChevronRight />}
                                >
                                    NLP
                                </Accordion.Trigger>
                                <Accordion.Content>
                                    <Stack direction="column" gap={1}>
                                        <Typography variant={'caption'}>
                                            LLM Config
                                        </Typography>
                                        <Typography variant={'caption'}>
                                            Prompt Config
                                        </Typography>
                                        <Typography variant={'caption'}>
                                            LLM Runner
                                        </Typography>
                                    </Stack>
                                </Accordion.Content>
                            </Accordion>
                        </Stack>
                    </Grid>
                    <Grid item xs={9.5}>
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
                    </Grid>
                </Grid>
            </Stack>
        </Stack>
    );
});
