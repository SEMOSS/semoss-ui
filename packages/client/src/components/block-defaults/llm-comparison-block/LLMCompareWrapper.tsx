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
    allModels: [],
    defaultLLMVariant: {
        selected: true,
        models: [
            {
                alias: 'llm1',
                value: 'f7cc988b-8c74-406e-87e3-ba30ca42c6fd',
                database_name: 'openAI test',
                database_subtype: 'OPEN_AI',
                database_type: 'MODEL',
                topP: 0.2,
                temperature: 0.7,
                length: 690,
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
            ],
        },
    ],
    designerView: 'allVariants',
    editorVariantIndex: null,
    editorModelIndex: null,
    editorVariant: null,
    editorModel: null,
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
    database_type: null,
    database_subtype: null,
    topP: 0,
    temperature: 0,
    length: 0,
};

const buildEmptyVariant = (modelCount: number): TypeVariant => {
    const emptyVariantCopy = emptyVariant;

    emptyVariantCopy.models = Array(modelCount).fill(emptyModel);

    return emptyVariant;
};

const modelEngineOutput = (output: any[]): TypeLlmConfig[] => {
    return output.map((data) => {
        return {
            alias: data.app_name,
            value: data.database_id,
            database_name: data.database_name,
            database_type: data.database_type,
            database_subtype: data.database_subtype,
            topP: data.TODO_FIND_NAME ? data.TODO_FIND_NAME : null,
            temperature: data.TODO_FIND_NAME ? data.TODO_FIND_NAME : null,
            length: data.TODO_FIND_NAME ? data.TODO_FIND_NAME : null,
        };
    });
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
    /** Children els to render */
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

        fetchAllModels();
    }, []);

    useEffect(() => {
        setDefaultModels();
    }, [variables.length]);

    /** Get default models used in app and details behind them */
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

    /** Get all availabe models to configure variants with */
    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = modelEngineOutput(res.pixelReturn[0].output);

        dispatch({
            type: 'field',
            field: 'allModels',
            value: modelled,
        });
    };

    const addVariant = (index: number, variant: TypeVariant) => {
        let variantsCopy = llmVariants;
        variantsCopy = [
            ...variantsCopy.slice(0, index + 1),
            variant,
            ...variantsCopy.slice(index + 1),
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

    const setEditorVariant = (index: number | null, duplicate?: boolean) => {
        dispatch({
            type: 'field',
            field: 'editorVariantIndex',
            value: index,
        });

        let variant: null | TypeVariant = null;

        if (duplicate) {
            if (index === -1) {
                variant = defaultLLMVariant;
            } else {
                variant = llmVariants[index];
            }
        } else {
            variant = buildEmptyVariant(defaultLLMVariant.models.length);
        }

        dispatch({
            type: 'field',
            field: 'editorVariant',
            value: variant,
        });
    };

    const setEditorModel = (
        variantIndex: number | null,
        modelIndex: number | null,
    ) => {
        dispatch({
            type: 'field',
            field: 'editorVariantIndex',
            value: variantIndex,
        });
        dispatch({
            type: 'field',
            field: 'editorModelIndex',
            value: modelIndex,
        });

        dispatch({
            type: 'field',
            field: 'editorModel',
            value:
                variantIndex === null && modelIndex === null
                    ? null
                    : llmVariants[variantIndex]?.models[modelIndex],
        });
    };

    return (
        <LLMComparisonContext.Provider
            value={{
                allModels: state.allModels,
                variants: llmVariants,
                defaultVariant: defaultLLMVariant,
                addVariant,
                deleteVariant,
                editVariant,
                swapVariantModel,
                designerView: state.designerView,
                setDesignerView,
                editorVariantIndex: state.editorVariantIndex,
                editorModelIndex: state.editorModelIndex,
                editorVariant: state.editorVariant,
                editorModel: state.editorModel,
                setEditorVariant,
                setEditorModel,
            }}
        >
            {children}
        </LLMComparisonContext.Provider>
    );
});
