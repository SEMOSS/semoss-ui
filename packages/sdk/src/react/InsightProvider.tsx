import { createContext, useState, useEffect, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { Insight } from '..';

/**
 * Context of the react data
 */
export const InsightContext = createContext<{
    isInitialized: Insight['isInitialized'];
    isAuthorized: Insight['isAuthorized'];
    error: Insight['error'];
    system: Insight['system'];
    actions: Insight['actions'];
}>(undefined);

interface InsightProviderProps {
    /** Id of the app */
    appId: string;
    /** Content to render with the insight */
    children: React.ReactNode;
}

export const InsightProvider = (props: InsightProviderProps) => {
    const { appId, children } = props;

    // create the new insight on load
    const insight = useMemo(() => {
        return new Insight(appId);
    }, [appId]);

    const [isInitialized, setIsInitialized] =
        useState<Insight['isInitialized']>(false);
    const [isAuthorized, setIsAuthorized] =
        useState<Insight['isAuthorized']>(false);
    const [error, setError] = useState<Insight['error']>(null);
    const [system, setSystem] = useState<Insight['system']>(null);

    /**
     * Load an insight with an id
     * @param id - id to load the insight with
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
            setIsInitialized(insight.isInitialized);
            setIsAuthorized(insight.isAuthorized);
            setError(insight.error);
            setSystem(insight.system);
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

    const wrappedActions: Insight['actions'] = useMemo(() => {
        const actions = {};
        for (const a in insight.actions) {
            actions[a] = async (...args) => {
                // wait for the action to complete
                const response = await insight.actions[a].apply(null, args);

                // sync it
                syncInsight();

                // return the response
                return response;
            };
        }

        return actions as Insight['actions'];
    }, [insight.actions]);

    // initialize the insight / destroy
    useEffect(() => {
        // initialize it
        initializeInsight();

        return () => {
            console.log('destroying');
            // destroy it
            destroyInsight();
        };
    }, [insight]);

    return (
        <InsightContext.Provider
            value={{
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
