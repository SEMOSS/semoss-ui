import { useContext } from 'react';

import { ChatContext } from '@/contexts';

/**
 * Access the current ChatStore
 * @returns the ChatStore
 */
export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within Chat');
    }

    return context;
};
