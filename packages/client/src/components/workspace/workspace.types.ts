export interface TypeVariant {
    name: string;
    models: TypeLlmConfig[];
}

export interface TypeLlmConfig {
    name: string;
    icon: string;
    topP: number;
    temperature: number;
    length: number;
}
