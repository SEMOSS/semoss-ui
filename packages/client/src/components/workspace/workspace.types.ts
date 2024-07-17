export interface TypeVariant {
    name?: string;
    selected: boolean;
    models: TypeLlmConfig[];
    sortWeight?: number | null;
    trafficAllocation?: number | null;
}

export interface TypeLlmConfig {
    alias: string | null;
    value: string | null;
    database_name: string | null;
    database_type: string | null;
    database_subtype: string | null;
    topP: number | null;
    temperature: number | null;
    length: number | null;
}

export interface DefaultModelVariant extends TypeLlmConfig {
    to: string;
    type: string;
}

export type TypeLlmConfigureView = 'allVariants' | 'variantEdit' | 'modelEdit';

export type TypeVariantDisplayOrder = 'default' | 'random' | 'custom';

export interface TypeLlmComparisonForm {
    /** Default Variant configured by user. */
    defaultVariant: TypeVariant;

    /** Additional Variants available to be displayed in the response */
    variants: TypeVariant[];

    /** view for the LLM Comparison Block's Configure Submenu in the designer */
    designerView: TypeLlmConfigureView;

    /** Reference indeces for Variant/Model being edited in the designer */
    editorVariantIndex: number | null;
    editorModelIndex: number | null;

    /** Variant being edited in the designer */
    editorVariant: TypeVariant | null;

    /** Single model being edited in the designer */
    editorModel: TypeLlmConfig | null;

    /** Models being edited in the LLM Comparison's variant/model Editor */
    modelsToEdit: TypeLlmConfig[];

    /** Determines whether the model's for a variant should be displayed in its response */
    showModelsInResponse: boolean;

    /** display order for variants in the response */
    orderType: TypeVariantDisplayOrder;

    /** Value for allocation */
    sampleSize: number | null;
}
