import { NodeComponent, NodeConfig } from '@/components/pipeline';

interface AgentNodeConfig extends NodeConfig<'agent-node'> {
    parameters: {
        FRAME: 'frame';
        PROMPT: 'string';
    };
}

export const AgentNode: NodeComponent<AgentNodeConfig> = () => {
    return <>Agent</>;
};

AgentNode.guid = 'agent-node';
AgentNode.config = {
    name: 'Agent',
    parameters: {
        FRAME: {
            type: 'frame',
            value: {
                name: '',
            },
        },
        PROMPT: {
            type: 'string',
            value: '',
        },
    },
    input: ['FRAME', 'PROMPT'],
    output: [],
};
