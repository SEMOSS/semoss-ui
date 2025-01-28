import { createContext } from "react";
import { Control, UseFormHandleSubmit } from "react-hook-form";

import { TypeLlmComparisonForm, TypeLlmConfig } from "../../../../types";

// TODO: FIX TYPES
export type LLMComparisonContextType = {
    /** Block's ID from the App's JSON */
    blockId: string;

    /** React Hook Form methods stored for nested components' access */
    control: Control<TypeLlmComparisonForm, unknown> | null;

    getValues: null | ((str?: string) => unknown);

    setValue: null | ((str: string, val: unknown) => void);

    watch: (str: string) => unknown;

    handleSubmit: UseFormHandleSubmit<TypeLlmComparisonForm, undefined>;

    /** All Models available for configuring variants */
    allModels: TypeLlmConfig[];
};

export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
