import React, { useEffect, useReducer } from 'react';
import { LLMComparisonContext } from '@/contexts/LLMComparisonContext';
import { useNotification } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useBlocks } from '@/hooks';
import { useRootStore } from '@/hooks';
import {
    TypeLlmConfig,
    TypeLlmConfigureView,
    TypeVariant,
} from '../../workspace/workspace.types';

// TODO: clean out fake data when BE is operational
const initialState = {
    defaultLLMVariant: {
        selected: true,
        models: [
            {
                alias: 'llm1',
                value: '001510f8-b86e-492e-a7f0-41299775e7d9',
                database_name: 'AIC',
                database_subtype: 'OPEN_AI',
                database_type: 'MODEL',
            },
            {
                alias: 'llm2',
                value: '001510f8-b86e-492e-a7f0-41299775e7d8',
                database_name: 'AIC',
                database_subtype: 'OPEN_AI',
                database_type: 'MODEL',
            },
            {
                alias: 'llm3',
                value: '001510f8-b86e-492e-a7f0-41299775e7d7',
                database_name: 'AIC',
                database_subtype: 'OPEN_AI',
                database_type: 'MODEL',
            },
        ],
    },
    llmVariants: [
        {
            name: 'A',
            selected: false,
            models: [
                {
                    alias: 'llm Z',
                    value: '123',
                    database_name: 'AIC',
                    database_subtype: 'OPEN_AI',
                    database_type: 'MODEL',
                },
                {
                    alias: 'llm Y',
                    value: '456',
                    database_name: 'hhaha',
                    database_subtype: 'OPEN_AI',
                    database_type: 'MODEL',
                },
                {
                    alias: 'llm X',
                    value: '789',
                    database_name: 'hhaha',
                    database_subtype: 'OPEN_AI',
                    database_type: 'MODEL',
                },
            ],
        },
        {
            name: 'B',
            selected: false,
            models: [
                {
                    alias: 'llm W',
                    value: '321',
                    database_name: 'AIC',
                    database_subtype: 'OPEN_AI',
                    database_type: 'MODEL',
                },
                {
                    alias: 'llm V',
                    value: '654',
                    database_name: 'hhaha',
                    database_subtype: 'OPEN_AI',
                    database_type: 'MODEL',
                },
                {
                    alias: 'llm U',
                    value: '987',
                    database_name: 'hhaha',
                    database_subtype: 'OPEN_AI',
                    database_type: 'MODEL',
                },
            ],
        },
    ],
};

const emptyVariant: TypeVariant = {
    name: 'Empty Variant',
    selected: false,
    models: [],
};

const emptyModel: TypeLlmConfig = {
    alias: null,
    value: null,
    database_name: null,
    database_subtype: null,
    database_type: null,
    topP: 0,
    temperature: 0,
    length: 0,
};

const buildEmptyVariant = (modelCount: number): TypeVariant => {
    const emptyVariantCopy = emptyVariant;

    emptyVariantCopy.models = Array(modelCount).fill(emptyModel);

    return emptyVariant;
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

interface LLMCompareWrapperProps {
    /**
     * Children els to render
     */
    children: React.ReactNode;
}

export const LLMCompareWrapper = observer((props: LLMCompareWrapperProps) => {
    const { children } = props;
    const { state: appState } = useBlocks();
    const notification = useNotification();
    const { monolithStore } = useRootStore();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { llmVariants, defaultLLMVariant } = state;

    const variables = Object.entries(appState.variables);

    useEffect(() => {
        notification.add({
            color: 'info',
            message:
                'The LLM Comparison tool is currently in beta, please contact the administrator with any issues with this part of the tool',
        });
    }, []);

    useEffect(() => {
        setDefaultModels();
    }, [variables.length]);

    /**
     * @desc get default models used in app and details behind them
     */
    const setDefaultModels = async () => {
        const vars = [];
        variables.forEach((v) => {
            const val = v[1];
            if (val.type === 'model') {
                const value = {
                    ...val,
                    value: appState.getVariable(val.to, val.type),
                };
                vars.push(value);
            }
        });

        let pixel = '';

        vars.forEach((v) => {
            pixel += `GetEngineMetadata(engine=["${v.value}"]);`;
        });

        const resp = (await monolithStore.runQuery(pixel)).pixelReturn;

        resp.forEach((o) => {
            const output = o.output;
            const found = vars.find(
                (variable) => variable.value === output.database_id,
            );

            found.database_name = output.database_name;
            found.database_subtype = output.database_subtype;
            found.database_type = output.database_type;
        });

        dispatch({
            type: 'field',
            field: 'defaultLLMVariant',
            value: vars,
        });
    };

    const addVariant = (index: number, variant?: TypeVariant) => {
        const newVariant = variant
            ? variant
            : buildEmptyVariant(defaultLLMVariant.models.length);

        let variantsCopy = llmVariants;
        variantsCopy = [
            ...variantsCopy.slice(0, index),
            newVariant,
            ...variantsCopy.slice(index),
        ];

        dispatch({
            type: 'field',
            field: 'llmVariants',
            value: variantsCopy,
        });
    };

    const deleteVariant = (index: number) => {
        const variantsCopy = [...llmVariants];
        variantsCopy.splice(index, 1);

        dispatch({
            type: 'field',
            field: 'llmVariants',
            value: variantsCopy,
        });
    };

    const editVariant = (index: number, variant: TypeVariant) => {
        if (index === -1) {
            dispatch({
                type: 'field',
                field: 'defaultLLMVariant',
                value: variant,
            });
        } else {
            const variantsCopy = llmVariants;
            variantsCopy[index] = variant;

            dispatch({
                type: 'field',
                field: 'llmVariants',
                value: variantsCopy,
            });
        }
    };

    const swapVariantModel = (
        variantIndex: number,
        modelIndex: number,
        model: TypeLlmConfig,
    ) => {
        const variantsCopy = llmVariants;

        variantsCopy[variantIndex].models[modelIndex] = model;

        dispatch({
            type: 'field',
            field: 'llmVariants',
            value: variantsCopy,
        });
    };

    const setDesignerView = (view: TypeLlmConfigureView) => {
        dispatch({
            type: 'field',
            field: 'designerView',
            value: view,
        });
    };

    const setEditorVariant = (index: number | null) => {
        dispatch({
            type: 'field',
            field: 'editorVariant',
            value: index,
        });
    };

    const setEditorModel = (index: number | null) => {
        dispatch({
            type: 'field',
            field: 'editorModel',
            value: index,
        });
    };

    return (
        <LLMComparisonContext.Provider
            value={{
                variants: llmVariants,
                defaultVariant: defaultLLMVariant,
                addVariant,
                deleteVariant: deleteVariant,
                editVariant,
                swapVariantModel: swapVariantModel,
                designerView: 'allVariants',
                setDesignerView,
                editorVariantIndex: null,
                setEditorVariant,
                editorModelIndex: null,
                setEditorModel,
            }}
        >
            {children}
        </LLMComparisonContext.Provider>
    );
});
