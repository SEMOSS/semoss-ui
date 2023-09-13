import { createContext, useState, useEffect, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { Insight } from '@/ts-utils';

/**
 * Context of the react data
 */
export const InsightContext = createContext<
    | {
          insight: Insight;
          isInitialized: Insight['isInitialized'];
          isAuthorized: Insight['isAuthorized'];
          error: Insight['error'];
          system: Insight['system'];
          actions: Insight['actions'];
      }
    | undefined
>(undefined);

interface InsightProviderProps {
    /** Content to render with the insight */
    children: React.ReactNode;
}

export const InsightProvider = (props: InsightProviderProps) => {
    const { children } = props;

    // create the new insight on load
    const insight = useMemo(() => {
        return new Insight();
    }, []);

    const [isInitialized, setIsInitialized] =
        useState<Insight['isInitialized']>(false);
    const [isAuthorized, setIsAuthorized] =
        useState<Insight['isAuthorized']>(false);
    const [error, setError] = useState<Insight['error']>(null);
    const [system, setSystem] = useState<Insight['system']>(null);

    /**
     * Load an insight with an id
     */
    const initializeInsight = async () => {
        // initialize the insight
        await insight.initialize();

        // update the state
        syncInsight();
    };

    /**
     * Sync the insight with react
     */
    const syncInsight = async () => {
        unstable_batchedUpdates(() => {
            setError(insight.error);
            setSystem(insight.system);
            setIsAuthorized(insight.isAuthorized);
            setIsInitialized(insight.isInitialized);
        });
    };

    /**
     * Destroy the insight
     */
    const destroyInsight = async () => {
        // initialize the insight
        await insight.destroy();

        // update the state
        syncInsight();
    };

    const wrappedActions = useMemo(() => {
        return Object.keys(insight.actions).reduce((acc, val) => {
            //@ts-expect-error TODO Fix Typing
            acc[val] = async (...args: unknown[]) => {
                // wait for the action to complete
                //@ts-expect-error TODO Fix Typing
                const response = await acc[val].call(acc[val], [...args]);

                // sync it
                syncInsight();

                // return the response
                return response;
            };

            return acc;
        }, {} as Insight['actions']);
    }, [insight.actions]);

    // initialize the insight / destroy
    useEffect(() => {
        // initialize it
        initializeInsight();

        return () => {
            // destroy it
            destroyInsight();
        };
    }, []);

    return (
        <InsightContext.Provider
            value={{
                insight: insight,
                isInitialized: isInitialized,
                isAuthorized: isAuthorized,
                error: error,
                system: system,
                actions: wrappedActions,
            }}
        >
            {children}
        </InsightContext.Provider>
    );
};
