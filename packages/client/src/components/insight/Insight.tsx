import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { InsightContext } from '@/contexts';
import { InsightStore } from '@/stores/insight';

export interface InsightProps {
    /** Id of the insight to load */
    id: string;

    /** Content to provide the InsightStore to */
    children: React.ReactNode;

    /** Mode to render the widgets */
    registry: unknown;
}
/**
 * Component that wraps an insight
 */
export const Insight = observer((props: InsightProps): JSX.Element => {
    const { children, id, registry } = props;

    const store = useMemo(() => {
        return new InsightStore();
    }, []);

    return (
        <InsightContext.Provider
            value={{
                insight: store,
                registry: registry,
            }}
        >
            {children}
        </InsightContext.Provider>
    );
});
