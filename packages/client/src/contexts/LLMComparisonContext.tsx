import { createContext } from 'react';
import { TypeVariant, TypeLlmConfig } from '@/components/workspace';

export type LLMComparisonContextType = {
    /** the variants we want to test on this app */
    variants: TypeVariant[];

    /** default variant in app */
    defaultVariant: TypeVariant;

    /** Adds Variant to context */
    addNewVariant: (index: number | TypeVariant) => void;

    /** Delete Variant set in context */
    deleteVariant: (index: number) => void;

    /** Swap function of variant model */
    swapVariantModel: (
        variantIndex: number,
        modelIndex: number,
        model: TypeLlmConfig,
    ) => void;
};

/**
 * Context
 */
export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
