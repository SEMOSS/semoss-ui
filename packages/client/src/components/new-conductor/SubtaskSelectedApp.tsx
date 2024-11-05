import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Blocks } from '../blocks';
import { SerializedState, StateStore } from '@/stores';
import { DefaultBlocks } from '../block-defaults';
import { DefaultCells } from '../cell-defaults';
import { useBlocks } from '@/hooks';
import { Button } from '@semoss/ui';

const TEST_APP_STRUCT: SerializedState = {
    queries: {
        default: {
            id: 'default',
            cells: [
                {
                    id: '33033',
                    widget: 'code',
                    parameters: {
                        code: 'LLM(engine = "001510f8-b86e-492e-a7f0-41299775e7d9", command = "<encode>What are the skills required for {{job}}</encode>", paramValues = [ {} ] );',
                        type: 'pixel',
                    },
                },
                {
                    id: '95747',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "{{cell}}['response']",
                    },
                },
            ],
        },
        'another-query': {
            id: 'another-query',
            cells: [
                {
                    id: '99430',
                    widget: 'code',
                    parameters: {
                        code: 'r"""These are the list of skills: {{list-of-skills}}"""',
                        type: 'py',
                    },
                },
            ],
        },
    },
    blocks: {
        'page-1': {
            slots: {
                content: {
                    children: ['input--1063'],
                    name: 'content',
                },
            },
            widget: 'page',
            data: {
                style: {
                    padding: '24px',
                    fontFamily: 'roboto',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                },
            },
            listeners: {
                onPageLoad: [],
            },
            parent: null,
            id: 'page-1',
        },
        'input--1063': {
            id: 'input--1063',
            widget: 'input',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'software engineer',
                label: 'job',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
    },
    variables: {
        'list-of-skills': {
            type: 'query',
            to: 'default',
            isOutput: true,
        },
        job: {
            type: 'block',
            to: 'input--1063',
            isInput: true,
        },
        cell: {
            type: 'cell',
            to: 'default',
            cellId: '33033',
            isInput: true,
        },
    },
    dependencies: {},
    executionOrder: ['default', 'another-query'],
    version: '1.0.0-alpha.3',
};

/**
 * Show the App Inputs
 */
export const SubtaskSelectedApp = observer(() => {
    // const state = new StateStore({
    //     mode: 'interactive',
    //     insightId: 'new',
    //     state: TEST_APP_STRUCT,
    //     cellRegistry: DefaultCells,
    //     initialParams: {
    //         job: 'Surgeon',
    //     },
    // });

    return (
        <div>
            show app inputs
            {/* <Blocks state={state} registry={DefaultBlocks}>
                <SubtaskChild />
            </Blocks> */}
        </div>
    );
});

const SubtaskChild = () => {
    const { state } = useBlocks();
    const [output, setOutput] = useState('');
    console.log(state.executionOrder);
    return (
        <div>
            <Button
                onClick={async () => {
                    const resp = await state.executeApp();
                    setOutput(resp);
                }}
            >
                execute
            </Button>
            {JSON.stringify(state.executionOrder)}
            {JSON.stringify(output)}
        </div>
    );
};
