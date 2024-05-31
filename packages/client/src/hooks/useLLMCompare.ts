import { useContext } from 'react';

import { LLMComparisonContext, LLMComparisonContextType } from '@/contexts';

/**
 * Access the current LLM Comparison Context
 * @returns the LLM Comparison Context
 */
export function useLLMComparison(): LLMComparisonContextType {
    const context = useContext(LLMComparisonContext);
    if (context === undefined) {
        throw new Error(
            'useLLMComparison must be used within LLM Comparison Provider',
        );
    }

    return context;
}
