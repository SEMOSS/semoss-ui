import { useEffect, useState, useCallback } from 'react';
import {
    styled,
    Typography,
    TextField,
    IconButton,
    FileDropzone,
    useNotification,
} from '@semoss/ui';
import { LoadingScreen } from '@/components/ui';
import { ArrowUpward, Mic } from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { usePixel, useRootStore } from '@/hooks';
// import { Background } from '@xyflow/react';

import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';

// Example valid node structure from react flow docs
// { id: '1', position: { x: 0, y: 0 }, data: { label: createNodeLabel('1'), text: "" } },

const NodeComponent = (props) => {
    return (
        <div style={{ border: '1px solid red', width: '100%' }}>
            {props.children}
        </div>
    );
};

const TEST_NODES = [
    {
        id: '1',
        width: 1000,
        position: { x: 0, y: 0 },
        data: { label: <NodeComponent>1</NodeComponent> },
        text: '',
    },
    {
        id: '2',
        width: 1000,
        position: { x: 0, y: 100 },
        data: { label: <NodeComponent>2</NodeComponent> },
        text: '',
    },
    {
        id: '3',
        width: 1000,
        position: { x: 0, y: 200 },
        data: { label: <NodeComponent>3</NodeComponent> },
        text: '',
    },

    // {
    //     "id": "1",
    //     "data": { "label": <h2>Start Node</h2> },
    //     "position": { "x": 50, "y": 50 },
    //     "type": "input",
    //     "targetPosition": "left",
    //     "text": "",
    //     "sourcePosition": "right"
    // },
    // {
    //     "id": "2",
    //     "data": { "label": <h2>Process A</h2> },
    //     "position": { "x": 200, "y": 50 },
    //     "targetPosition": "left",
    //     "text": "",
    //     "sourcePosition": "right"
    // },
    // {
    //     "id": "3",
    //     "data": { "label": <h2>Process B</h2> },
    //     "position": { "x": 350, "y": 150 },
    //     "targetPosition": "top",
    //     "text": "",
    //     "sourcePosition": "bottom"
    // },
    // {
    //     "id": "4",
    //     "data": { "label": <h2>Decision</h2> },
    //     "position": { "x": 500, "y": 50 },
    //     "targetPosition": "left",
    //     "text": "",
    //     "sourcePosition": "right"
    // },
    // {
    //     "id": "5",
    //     "data": { "label": <h2>Process C</h2> },
    //     "position": { "x": 650, "y": 50 },
    //     "targetPosition": "left",
    //     "text": "",
    //     "sourcePosition": "right"
    // },
    // {
    //     "id": "6",
    //     "data": { "label": <h2>End Node</h2> },
    //     "position": { "x": 800, "y": 150 },
    //     "type": "output",
    //     "targetPosition": "left",
    //     "text": "",
    // }
];

const TEST_EDGES = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e1-3', source: '1', target: '3' },

    // {
    // "id": "e1-2",
    // "source": "1",
    // "target": "2",
    // "animated": true,
    // "label": "Next"
    // },
    // {
    // "id": "e2-3",
    // "source": "2",
    // "target": "3",
    // "label": "Next"
    // },
    // {
    // "id": "e2-4",
    // "source": "2",
    // "target": "4",
    // "label": "Next"
    // },
    // {
    // "id": "e4-5",
    // "source": "4",
    // "target": "5",
    // "label": "Yes"
    // },
    // {
    // "id": "e5-6",
    // "source": "5",
    // "target": "6",
    // "label": "Next"
    // },
];

const ComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    margin: '50px',
    display: 'flex',
    flexGrow: '1',
}));

const TaskContainer = styled('div')(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderRadius: '25px',
    marginTop: '25px',
    padding: '30px',
    width: '100%',
    flexGrow: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const SubTaskContainer = styled('div')(({ theme }) => ({
    width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '12px',
}));

const SubTask = styled('div')(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '10px 30px 10px 20px',
    maxWidth: 'fit-content',
}));

type AIConductorForm = {
    uploadFile: File;
    taskInput: string;
};

export const NewAIConductorPage = (props) => {
    const { handleSubmit, control, reset, watch } = useForm<AIConductorForm>({
        defaultValues: {
            uploadFile: null,
            taskInput: '',
        },
    });

    const uploadFile = watch('uploadFile');
    const taskInput = watch('taskInput');

    // const [reactFlowNodes, setReactFlowNodes] = useState(null);
    // const [reactFlowEdges, setReactFlowEdges] = useState(null);

    // from test react flow app -----------------------------------------------
    // const [nodes, setNodes, onNodesChange] = useNodesState([]);
    // const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState(TEST_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(TEST_EDGES);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const nodeChangeHandler = (e) => {
        onNodesChange(e);
    };

    const nodeState = () => {
        console.log({
            nodes,
            edges,
        });
    };
    // -----------------------------------------------

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [subTaskElements, setSubTaskElements] = useState([
        {
            title: 'default message',
            content:
                'Define a task and AI Conductor will generate a roadmap to help you solve it!',
        },
    ]);
    const { id, condensed = false } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    useEffect(() => {
        // initial API calls load into useState
        // loadReactFlowStructure();
    });

    useEffect(() => {
        const childEle = document.querySelector('#conductor-container-div');
        const parentEle = childEle.parentElement;
        parentEle.style.display = 'flex';
        parentEle.style.flexDirection = 'column';

        return () => {
            parentEle.style.display = 'block';
            parentEle.style.flexDirection = '';
        };
    }, []);

    const loadReactFlowStructure = () => {
        // replace with API call
        setEdges(TEST_EDGES);
        setNodes(TEST_NODES);
    };

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        console.log({ data });
        setIsLoading(true);

        try {
            const path = 'version/assets/';
            await monolithStore.runQuery(
                `DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
            );

            const upload = await monolithStore.uploadFile(
                [data.uploadFile],
                configStore.store.insightID,
                id,
                path,
            );

            notification.add({
                color: 'success',
                message: 'Succesfully Uploaded File',
            });

            console.log({ upload });

            reset();
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            setIsLoading(false);
        }
    });

    return (
        <ComponentContainer id="conductor-container-div">
            <Typography variant="h4">AI Conductor</Typography>
            <Typography variant="body1">Description / Instructions</Typography>
            <TaskContainer>
                {isLoading && (
                    <LoadingScreen.Trigger description="Updating Project" />
                )}

                <SubTaskContainer>
                    {subTaskElements?.map((subTask) => (
                        <SubTask>{subTask.content}</SubTask>
                    ))}
                </SubTaskContainer>

                {/* <div style={{ width: '750px', height: '750px', display: "block", margin: "auto", border: "1px solid black", boxShadow: "-10px 10px 0 black" }}> */}
                <div style={{ width: '100%', height: '500px' }}>
                    <button onClick={nodeState}>print nodes state</button>
                    {/* <button onClick={addNode}>add node</button> */}
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={nodeChangeHandler}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        attributionPosition="bottom-right"
                        preventScrolling={true}
                        // edgesUpdatable={!true}
                        edgesFocusable={!true}
                        nodesDraggable={!true}
                        nodesConnectable={!true}
                        nodesFocusable={!true}
                        draggable={!true}
                        panOnDrag={!true}
                        elementsSelectable={!true}
                        // Optional if you also want to lock zooming
                        zoomOnDoubleClick={!true}
                        minZoom={true ? 1 : 0.5}
                        maxZoom={true ? 1 : 3}
                    >
                        {/* <Controls />
                        <MiniMap /> */}
                        {/* <Background 
                            variant={null} 
                            gap={12} 
                            size={1} 
                        /> */}
                    </ReactFlow>
                </div>

                <Controller
                    name={'uploadFile'}
                    control={control}
                    rules={{}}
                    render={({ field }) => {
                        return (
                            <FileDropzone
                                multiple={false}
                                value={field.value}
                                // disabled={isLoading}
                                onChange={(newValues) => {
                                    field.onChange(newValues);
                                }}
                            />
                        );
                    }}
                />

                <Controller
                    name={'taskInput'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                        return (
                            <StyledTextField
                                label="Name"
                                value={field.value ? field.value : ''}
                                variant="outlined"
                                placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                                // disabled={isLoading}
                                onChange={(value) => field.onChange(value)}
                                fullWidth={true}
                                InputProps={{
                                    startAdornment: (
                                        <span style={{ marginRight: '15px' }}>
                                            <b>Task</b>
                                        </span>
                                    ),
                                    endAdornment: (
                                        <>
                                            <IconButton disabled>
                                                <Mic />
                                            </IconButton>
                                            <IconButton
                                                onClick={taskSubmitHandler}
                                            >
                                                <ArrowUpward />
                                            </IconButton>
                                        </>
                                    ),
                                }}
                            />
                        );
                    }}
                />
            </TaskContainer>
        </ComponentContainer>
    );
};
