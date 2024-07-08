import { TypeLlmConfig } from '@/components/workspace';

interface PropsLLMEditor {
    /** Model currently populated/saved to the variant */
    model?: TypeLlmConfig;

    /** Index withing the variant's 'models' array */
    index: number;
}

export const LLMEditor = (props: PropsLLMEditor) => {
    return <div>LLM EDITOR: {props.model.alias}</div>;
};
