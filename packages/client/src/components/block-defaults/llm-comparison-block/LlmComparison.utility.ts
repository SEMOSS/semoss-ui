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
            topP: 0,
            temperature: 0,
            length: 0,
        };
    });
};

// Generates a Unique ID/Name for a variant when created.
export const generateVariantName = (currNames: string[]): string | null => {
    const modelled = currNames
        .filter((name) => name.toLowerCase() !== 'default')
        .map((name) => name.toLowerCase())
        .sort();

    let charCode = 65,
        newLetter = null;
    for (charCode; charCode < 91; charCode++) {
        const codeAsLetter = String.fromCharCode(charCode).toLowerCase();
        const found = modelled.includes(codeAsLetter);
        if (!found) {
            newLetter = codeAsLetter;
            break;
        }
    }
    return newLetter;
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
