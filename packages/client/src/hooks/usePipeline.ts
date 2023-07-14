import { useContext } from 'react';

import { PipelineContext } from '@/contexts';

/**
 * Access the current PipelineStore
 * @returns the PipelineStore
 */
export const usePipeline = () => {
    const context = useContext(PipelineContext);
    if (context === undefined) {
        throw new Error('usePipeline must be used within Pipeline');
    }

    return context;
};
