import { createContext } from 'react';

import { ChatStore } from '@/stores';

/**
 * Value
 */
type ChatContextProps = {
    /** chat store */
    chat: ChatStore;
};

/**
 * Context
 */
export const ChatContext = createContext<ChatContextProps | undefined>(
    undefined,
);
