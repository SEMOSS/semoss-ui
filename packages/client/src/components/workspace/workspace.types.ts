export interface TypeVariant {
    name?: string;
    selected: boolean;
    models: TypeLlmConfig[];
}

export interface TypeLlmConfig {
    alias: string | null;
    value: string | null;
    database_name: string | null;
    database_subtype: string | null;
    database_type: string | null;
    icon?: string;
    topP?: number;
    temperature?: number;
    length?: number;
}

export interface DefaultModelVariant extends TypeLlmConfig {
    to: string;
    type: string;
}

export type TypeLlmConfigureView = 'allVariants' | 'editVariant' | 'editModel';
