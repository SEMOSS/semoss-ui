import { useConductor } from '@/hooks';
import React, { useEffect } from 'react';

// interface TaskExecutionProps {}
export const TaskExecution = () => {
    const { conductor } = useConductor();

    useEffect(() => {
        // TODO: Call LLM reactor and chain subtask with initial prompt
    }, []);

    return (
        <div>
            Needs to call the LLM reactor with the same insight id to preserve
            the same convo history. But pass the subtask description along with
            the output of subtask
        </div>
    );
};
