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

export const emptyModel: TypeLlmConfig = {
    alias: null,
    value: null,
    database_name: null,
    database_type: null,
    database_subtype: null,
    topP: 0,
    temperature: 0,
    length: 0,
};

export const LlmComparisonFormDefaultValues: TypeLlmComparisonForm = {
    variants: {},
    designerView: 'allVariants',
    editorVariantName: null,
    editorVariant: null,
    showModelsInResponse: true,
    orderType: 'default',
    sampleSize: 100,
};
