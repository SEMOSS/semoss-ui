import { NodeRegistry } from '@/components/pipeline';

import { AgentNode } from './agent-node';
import { ImportNode } from './import-node';
import { MergeNode } from './merge-node';
import { PromptNode } from './prompt-node';

export const PIPELINE_REGISTRY: NodeRegistry = {
    [AgentNode.guid]: AgentNode,
    [ImportNode.guid]: ImportNode,
    [MergeNode.guid]: MergeNode,
    [PromptNode.guid]: PromptNode,
};
