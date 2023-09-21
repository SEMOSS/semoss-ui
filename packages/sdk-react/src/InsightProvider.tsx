import { createContext, useState, useEffect, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { Insight } from '@semoss/sdk';

/**
 * Context of the react data
 */
export const InsightContext = createContext<
    | {
          isInitialized: Insight['isInitialized'];
          isAuthorized: Insight['isAuthorized'];
          error: Insight['error'];
          system: Insight['system'];
          actions: Insight['actions'];
      }
    | undefined
>(undefined);

interface InsightProviderProps {
    /**
     * Content to render with the insight
     */
    children: React.ReactNode;

    /**
     * Options to load into the app
     */
    options?: Parameters<Insight['initialize']>[0];
}

export const InsightProvider = (props: InsightProviderProps) => {
    const { children, options } = props;

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

    const wrappedActions = useMemo(() => {
        return Object.keys(insight.actions).reduce((acc, val) => {
            //@ts-expect-error TODO Fix Typing
            acc[val] = async (...args: unknown[]) => {
                // wait for the action to complete
                //@ts-expect-error TODO Fix Typing
                const response = await insight.actions[val].apply(null, [
                    ...args,
                ]);

                // sync it
                syncInsight();

                // return the response
                return response;
            };

            return acc;
        }, {} as Insight['actions']);
    }, [insight, insight.actions]);

    // initialize the insight / destroy
    useEffect(() => {
        // initialize the insight
        insight.initialize(options).finally(() => {
            // update the state
            syncInsight();
        });

        return () => {
            // destroy the insight
            insight.destroy().finally(() => {
                // update the state
                syncInsight();
            });
        };
    }, [insight, options]);

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
