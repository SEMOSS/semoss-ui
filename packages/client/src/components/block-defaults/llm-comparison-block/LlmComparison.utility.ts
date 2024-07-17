import { TypeLlmConfig, TypeLlmComparisonForm } from '@/components/workspace';

/**
 * METHODS ==================================================================
 */

// Models the payload of available 'model' engines for the LLM Comparison UI
export const modelEngineOutput = (output: any[]): TypeLlmConfig[] => {
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

/**
 * CONSTANTS ================================================================
 */

export const LlmComparisonFormDefaultValues: TypeLlmComparisonForm = {
    defaultVariant: {
        name: 'default',
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
    variants: [
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
                    topP: 0.6,
                    temperature: 1,
                    length: 210,
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
                    topP: 0.0,
                    temperature: 0.3,
                    length: 865,
                },
            ],
        },
    ],
    designerView: 'allVariants',
    editorVariantIndex: null,
    editorModelIndex: null,
    editorVariant: null,
    editorModel: null,
    modelsToEdit: [],
    showModelsInResponse: true,
    orderType: 'default',
    sampleSize: 100,
};
