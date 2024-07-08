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

    /** Adds/Duplicates a Variant to context */
    addVariant: (index: number, variant?: TypeVariant) => void;

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

    /** selected variant being edited in the designer */
    editorVariantIndex: number | null;
    setEditorVariant: (index: number | null) => void;

    /** selected model being edited in the designer */
    editorModelIndex: number | null;
    setEditorModel: (index: number | null) => void;
};

/**
 * Context
 */
export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
