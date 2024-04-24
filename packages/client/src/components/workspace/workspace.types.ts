export interface TypeVariant {
    name: string;
    models: TypeLlmConfig[];
    isSelected: boolean;
}

export interface TypeLlmConfig {
    name: string;
    topP: number;
    temperature: number;
    length: number;
}
