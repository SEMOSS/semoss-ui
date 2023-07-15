import { NodeComponent, NodeConfig } from '@/components/pipeline';

interface MergeNodeConfig extends NodeConfig<'merge-node'> {
    parameters: {
        SOURCE: 'frame';
        SOURCE_COLUMN: 'string';
        TARGET: 'frame';
        TARGET_COLUMN: 'string';
    };
}

export const MergeNode: NodeComponent<MergeNodeConfig> = () => {
    return <>Merge</>;
};

MergeNode.guid = 'merge-node';
MergeNode.config = {
    parameters: {
        SOURCE: {
            type: 'frame',
            value: {
                name: '',
            },
        },
        SOURCE_COLUMN: {
            type: 'string',
            value: '',
        },
        TARGET: {
            type: 'frame',
            value: {
                name: '',
            },
        },
        TARGET_COLUMN: {
            type: 'string',
            value: '',
        },
    },
    input: ['SOURCE', 'TARGET'],
    output: ['TARGET'],
};
MergeNode.display = {
    name: 'Merge',
    description: '',
    icon: '',
};

MergeNode.toPixel = (parameters) => {
    return `Frame(${parameters.SOURCE.value.name}) | Merge(joins=[(${parameters.SOURCE_COLUMN.value} inner.join ${parameters.TARGET_COLUMN.value})], frame=[${parameters.TARGET.value.name}]);`;
};
