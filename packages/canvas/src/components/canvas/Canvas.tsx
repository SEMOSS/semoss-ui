import { useMemo } from 'react';

import { CanvasStore, Block, WidgetDef, WidgetRegistry, Query } from '@/stores';
import { CanvasContext } from '@/contexts';
import { Renderer } from './Renderer';

export interface CanvasProps<W extends WidgetDef> {
    /** Content to render  */
    children?: React.ReactNode;

    /** Insight ID to connect the canvas to */
    insightId?: string;

    /** Widgets available to all of the blocks */
    widgets: WidgetRegistry<W>;

    /** Current active block  */
    active?: string;

    /** Blocks that will be loaded into the canvas */
    blocks: Record<string, Block<W>>;

    /** Queries that will be loaed into the canvas */
    queries?: Record<string, Query>;

    /** Callback that is triggered when the json changes */
    onChange?: (json: string) => void;
}

export const Canvas = <W extends WidgetDef = WidgetDef>(
    props: CanvasProps<W>,
) => {
    const {
        children,
        insightId = 'new',
        widgets,
        active,
        blocks,
        queries = {},
    } = props;

    // create the store if possible
    const store = useMemo(() => {
        return new CanvasStore(insightId, {
            blocks: blocks,
            queries: queries,
        });
    }, [insightId, blocks, queries]);

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
            {!children && active ? <Renderer id={active} /> : children}
        </CanvasContext.Provider>
    );
};
