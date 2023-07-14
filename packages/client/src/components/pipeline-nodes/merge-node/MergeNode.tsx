import { NodeComponent, NodeConfig } from '@/components/pipeline';

interface MergeNodeConfig extends NodeConfig<'merge-node'> {
    parameters: {
        SOURCE_1: 'frame';
        SOURCE_2: 'frame';
        TARGET: 'frame';
    };
}

export const MergeNode: NodeComponent<MergeNodeConfig> = () => {
    return <>Merge</>;
};

MergeNode.guid = 'merge-node';
MergeNode.config = {
    name: 'Merge',
    parameters: {
        SOURCE_1: {
            type: 'frame',
            value: {
                name: '',
            },
        },
        SOURCE_2: {
            type: 'frame',
            value: {
                name: '',
            },
        },
        TARGET: {
            type: 'frame',
            value: {
                name: '',
            },
        },
    },
    input: ['SOURCE_1', 'SOURCE_2'],
    output: ['TARGET'],
};
