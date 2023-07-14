import { createContext } from 'react';

import { PipelineStore } from '@/stores';
import { NodeRegistry } from '@/components/pipeline';

export interface PipelineContextType {
    /** Store holding the pipeline information */
    pipeline: PipelineStore;

    /** Nodes that are available to the pipeline */
    registry: NodeRegistry;
}

/**
 * Pipeline Context
 */
export const PipelineContext = createContext<PipelineContextType>(undefined);
