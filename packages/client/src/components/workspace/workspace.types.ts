export interface TypeVariant {
    name?: string;
    selected: boolean;
    models: TypeLlmConfig[];
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

export interface TypeLlmComparisonForm {
    models: TypeLlmConfig[];
}
