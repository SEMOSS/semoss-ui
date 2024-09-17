export type TypeVariants = {
    [key: string]: TypeVariant;
};

export type TypeVariant = {
    model: TypeLlmConfig;
    sortWeight?: number | null;
    trafficAllocation?: number | null;
};

export interface VariantWithName extends TypeVariant {
    name: string;
}

export type TypeLlmConfig = {
    value: string | null;
    database_name: string | null;
    database_type: string | null;
    database_subtype: string | null;
    topP: number | null;
    temperature: number | null;
    length: number | null;
};

export type TypeLlmConfigureView = 'allVariants' | 'variantEdit';

export type TypeVariantDisplayOrder = 'default' | 'random' | 'custom';

export interface TypeLlmComparisonForm {
    /** Variants stored in the block's connected query/cell */
    variants: TypeVariants;

    /** view for the LLM Comparison Block's Configure Submenu in the designer */
    designerView: TypeLlmConfigureView;

    /** Reference values for Variant/model being edited in the designer */
    editorVariantName: string | null;
    editorVariant: TypeVariant | null;

    /** Determines whether the model's for a variant should be displayed in its response */
    showModelsInResponse: boolean;

    /** display order for variants in the response */
    orderType: TypeVariantDisplayOrder;

    /** Value for allocation */
    sampleSize: number | null;
}
