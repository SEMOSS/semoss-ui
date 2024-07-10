import { createContext } from 'react';
import {
    TypeVariant,
    TypeLlmConfig,
    TypeLlmConfigureView,
} from '@/components/workspace';

export type LLMComparisonContextType = {
    /** All Models available for configuring variants */
    allModels: any;

    /** the variants we want to test on this app */
    variants: TypeVariant[];

    /** default variant in app */
    defaultVariant: TypeVariant;

    /** Adds a Variant to context */
    addVariant: (index: number, variant: TypeVariant) => void;

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

    /** view for the LLM Comparison Block's Configure Submenu in the designer */
    designerView: TypeLlmConfigureView;

    /** sets the view state for the 'designerView' above */
    setDesignerView: (view: TypeLlmConfigureView) => void;

    /** Reference indeces for Variant/Model being edited in the designer */
    editorVariantIndex: number | null;
    editorModelIndex: number | null;

    /** Variant being edited in the designer */
    editorVariant: TypeVariant | null;

    /** Single model being edited in the designer */
    editorModel: TypeLlmConfig | null;

    /** Finds and sets the appropriate Variant and it's index to context */
    setEditorVariant: (variantIdx: number | null, duplicate?: boolean) => void;

    /** Finds and sets the appropriate model and it's indeces to state */
    setEditorModel: (
        variantIdx: number | null,
        modelIdx: number | null,
    ) => void;
};

/**
 * Context
 */
export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
