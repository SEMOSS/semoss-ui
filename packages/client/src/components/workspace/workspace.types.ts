export interface TypeVariant {
    name?: string;
    selected: boolean;
    models: TypeLlmConfig[];
}

export interface TypeLlmConfig {
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

export interface DefaultModelVariant extends TypeLlmConfig {
    to: string;
    type: string;
}

export type TypeLlmConfigureView = 'allVariants' | 'editVariant' | 'editModel';
