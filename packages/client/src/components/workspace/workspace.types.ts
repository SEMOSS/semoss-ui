export interface TypeVariant {
    name: string;
    models: TypeLlmConfig[];
    isSelected: boolean;
}

export interface TypeLlmConfig {
    name: string;
    icon: string;
    topP: number;
    temperature: number;
    length: number;
}
