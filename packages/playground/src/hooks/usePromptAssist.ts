import { useMemo } from 'react';
import { PromptAssistStore } from '../components/PromptAssist/PromptAssistStore';

// Singleton pattern for the store
let promptAssistStoreInstance: PromptAssistStore | null = null;

export const usePromptAssist = (): PromptAssistStore => {
  return useMemo(() => {
    if (!promptAssistStoreInstance) {
      promptAssistStoreInstance = new PromptAssistStore();
    }
    return promptAssistStoreInstance;
  }, []);
};
