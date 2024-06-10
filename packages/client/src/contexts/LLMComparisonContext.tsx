import { createContext } from 'react';

export interface ModelVariant {
    alias: string;
    value: string;
    database_name: string;
    database_subtype: string;
    database_type: string;

    name?: string;
    icon?: string;
    topP?: number;
    temperature?: number;
    length?: number;
}

export interface DefaultModelVariant extends ModelVariant {
    to: string;
    type: string;
}

export type LLMComparisonContextType = {
    /** the variants we want to test on this app */
    variants: (ModelVariant | null)[][];

    /** selected variants for comparison */
    selectedVariants: (ModelVariant | null)[][];

    /** default variant in app */
    defaultVariant: DefaultModelVariant[];

    /** Adds Variant to context */
    addNewVariant: (index: number | (ModelVariant | null)[]) => void;

    /** Delete Variant set in context */
    deleteVariant: (index: number) => void;

    /** Sets the selected variants */
    setSelectedVariants: (variants: ModelVariant[][]) => void;

    /** Swap function of variant model */
    swapVariantModel: (
        variantIndex: number,
        modelIndex: number,
        model: ModelVariant,
    ) => void;
};

/**
 * Context
 */
export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
