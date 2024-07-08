import { createContext } from 'react';
import {
    TypeVariant,
    TypeLlmConfig,
    TypeLlmConfigureView,
} from '@/components/workspace';

export type LLMComparisonContextType = {
    /** the variants we want to test on this app */
    variants: TypeVariant[];

    /** default variant in app */
    defaultVariant: TypeVariant;

    /** Adds Variant to context */
    addNewVariant: (index: number | TypeVariant) => void;

    /** Delete Variant set in context */
    deleteVariant: (index: number) => void;

    /** Edits the provided variant's details */
    editVariant: (index: number, newVariant: TypeVariant) => void;

    /** Swap function of variant model */
    swapVariantModel: (
        variantIndex: number,
        modelIndex: number,
        model: TypeLlmConfig,
    ) => void;

    /** view for the LLM Comparison Block's menu in the designer */
    designerView: TypeLlmConfigureView;

    /** sets the view state for the 'designerView' above */
    setDesignerView: (view: TypeLlmConfigureView) => void;

    // setConfigureVariant: (variantIndex: number) => void;

    // /** selected variant being edited in the designer */
    // selectedVariant: { variantIndex: number } & TypeVariant;

    // /** selected model being edited in the designer */
    // selectedModel: { variantIndex: number; modelIndex: number } & TypeLlmConfig;
};

/**
 * Context
 */
export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
