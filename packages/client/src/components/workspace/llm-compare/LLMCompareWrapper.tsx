import React, { useEffect, useMemo, useState, useReducer } from 'react';
import {
    LLMComparisonContext,
    ModelVariant,
} from '@/contexts/LLMComparisonContext';
import { useNotification } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useBlocks } from '@/hooks';
import { useRootStore } from '@/hooks';
import { TypeLlmConfig } from '../workspace.types';

const initialState = {
    defaultLLMVariant: [],
    llmVariants: [
        // [
        // {
        //     alias: 'llm',
        //     value: '001510f8-b86e-492e-a7f0-41299775e7d9',
        //     database_name: 'AIC',
        //     database_subtype: 'OPEN_AI',
        //     database_type: 'MODEL',
        // },
        // null,
        // {
        //     alias: 'llm-2',
        //     value: 'dbf6d2d7-dfba-4400-a214-6ac403350b04',
        //     database_name: 'hhaha',
        //     database_subtype: 'OPEN_AI',
        //     database_type: 'MODEL',
        // },
        // ],
        // [
        // {
        //     alias: 'llm',
        //     value: 'dbf6d2d7-dfba-4400-a214-6ac403350b04',
        //     database_name: 'hhaha',
        //     database_subtype: 'OPEN_AI',
        //     database_type: 'MODEL',
        // },
        // null,
        // {
        //     alias: 'llm-2',
        //     value: '17753d59-4536-4415-a6ac-f673b1a90a87',
        //     database_name: 'hhaha',
        //     database_subtype: 'OPEN_AI',
        //     database_type: 'MODEL',
        // },
        // ],
    ],
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

    useEffect(() => {
        console.log('variants length changed');
    }, [llmVariants.length]);

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

    const addNewVariant = (val) => {
        const variantsCopy = llmVariants;
        if (typeof val === 'object') {
            variantsCopy.push(val);
        } else if (val === -1) {
            variantsCopy.push(defaultLLMVariant);
        } else {
            variantsCopy.push(llmVariants[val]);
        }

        dispatch({
            type: 'field',
            field: 'llmVariants',
            value: variantsCopy,
        });
    };

    const deleteVariant = (index: number) => {
        const variantsCopy = llmVariants;
        variantsCopy.splice(index, 1);

        dispatch({
            type: 'field',
            field: 'llmVariants',
            value: variantsCopy,
        });
    };

    const swapVariantModel = (
        variantIndex: number,
        modelIndex: number,
        model: ModelVariant,
    ) => {
        const variantsCopy = llmVariants;

        variantsCopy[variantIndex][modelIndex] = model;

        dispatch({
            type: 'field',
            field: 'llmVariants',
            value: variantsCopy,
        });
    };

    return (
        <LLMComparisonContext.Provider
            value={{
                variants: llmVariants,
                defaultVariant: defaultLLMVariant,
                addNewVariant: addNewVariant,
                deleteVariant: deleteVariant,
                swapVariantModel: swapVariantModel,
            }}
        >
            {children}
        </LLMComparisonContext.Provider>
    );
});
