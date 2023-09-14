import { useMemo } from 'react';

import {
    CanvasStore,
    Block,
    WidgetRegistry,
    WidgetRegistryUnwrap,
    Query,
    Callbacks,
} from '@/stores';
import { CanvasContext } from '@/contexts';

export interface CanvasProps<R extends WidgetRegistry> {
    /** Content to render  */
    children: React.ReactNode;

    /** Widgets available to all of the blocks */
    widgets: R;

    /** Blocks that will be loaded into the canvas */
    blocks: Record<string, Block<WidgetRegistryUnwrap<R>>>;

    /** Queries that will be loaed into the canvas */
    queries?: Record<string, Query>;

    /** Callback that is triggered when the json changes */
    onChange?: Callbacks['onChange'];

    /** Callback that is triggered when a query is called */
    onQuery?: Callbacks['onQuery'];
}

export const Canvas = <R extends WidgetRegistry = WidgetRegistry>(
    props: CanvasProps<R>,
) => {
    const {
        children,
        widgets,
        blocks = {},
        queries = {},
        onChange = () => null,
        onQuery = async () => ({
            data: null,
        }),
    } = props;

    // create the store if possible
    const store = useMemo(() => {
        const s = new CanvasStore({
            blocks: blocks,
            queries: queries,
            onChange: onChange,
            onQuery: onQuery,
        });

        // Callback that is fired when the store is changed
        s.onChange(onChange);

        return s;
    }, [blocks, queries]);

    if (!store) {
        return null;
    }

    return (
        <CanvasContext.Provider
            value={{
                widgets: widgets,
                store: store,
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
};
