import { useContext } from "react";
import { createContext } from "react";
import { Control } from "react-hook-form";

export type LLMComparisonContextType = {
    /** Block's ID from the App's JSON */
    blockId: string;

    /** React Hook Form methods stored for nested components' access */
    control: Control<unknown, unknown> | null;
    getValues: null | ((str?: string) => unknown);
    setValue: null | ((str: string, val: unknown) => void);
    watch: unknown;
    handleSubmit: unknown;

    /** All Models available for configuring variants */
    allModels: unknown;
};

export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);

export type LLMContextType = {
    /** id to use for code generation */
    modelId: string;
    /** model options for code generation */
    modelOptions: { app_id: string; app_name: string }[];
    /** set model to use */
    setModel?: (id: string) => void;
};

/**
 * Context
 */
export const LLMContext = createContext<LLMContextType>(undefined);

/**
 * Access the current LLM Comparison Context
 * @returns the LLM Comparison Context
 */
export function useLLMComparison(): LLMComparisonContextType {
    const context = useContext(LLMComparisonContext);
    if (context === undefined) {
        throw new Error(
            "useLLMComparison must be used within LLM Comparison Provider",
        );
    }

    return context;
}
