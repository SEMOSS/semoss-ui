export type TypeVariants = {
    [key: string]: TypeVariant;
};

export type TypeVariant = {
    selected: boolean;
    models: TypeLlmConfig[];
    sortWeight?: number | null;
    trafficAllocation?: number | null;
};

export interface VariantWithName extends TypeVariant {
    name: string;
}

export type TypeLlmConfig = {
    alias?: string | null;
    value: string | null;
    database_name: string | null;
    database_type: string | null;
    database_subtype: string | null;
    topP: number | null;
    temperature: number | null;
    length: number | null;
};

export type TypeLlmConfigureView = 'allVariants' | 'variantEdit' | 'modelEdit';

export type TypeVariantDisplayOrder = 'default' | 'random' | 'custom';

export interface TypeLlmComparisonForm {
    /** Default Variant configured by user. */
    defaultVariant: TypeVariant;

    /** Additional Variants available to be displayed in the response */
    variants: TypeVariants;

    /** view for the LLM Comparison Block's Configure Submenu in the designer */
    designerView: TypeLlmConfigureView;

    /** Reference values for Variant/Model being edited in the designer */
    editorVariantName: string | null;
    editorModelIndex: number | null;

    /** used to set the variant's Unique Id for the variant's object in App state */
    newVariantName: string | null;

    /** Models being edited in the LLM Comparison's variant/model Editor */
    ModelsInEditor: TypeLlmConfig[];

    /** Determines whether the model's for a variant should be displayed in its response */
    showModelsInResponse: boolean;

    /** display order for variants in the response */
    orderType: TypeVariantDisplayOrder;

    /** Value for allocation */
    sampleSize: number | null;
}
