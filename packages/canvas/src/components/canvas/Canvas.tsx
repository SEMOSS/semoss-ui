import { useMemo } from 'react';

import { CanvasStore, WidgetRegistry, Callbacks, CanvasConfig } from '@/stores';
import { CanvasContext } from '@/contexts';

export interface CanvasProps<R extends WidgetRegistry> {
    /** Content to render  */
    children: React.ReactNode;

    /** Config to pass into the canvas store */
    config: CanvasConfig<R>;

    /** Widgets available to all of the blocks */
    widgets: R;

    /** OnChange callback that is triggered after a dispatch */
    onChange?: Callbacks['onChange'];

    /** onQuery callback that is triggered when a query is run */
    onQuery?: Callbacks['onQuery'];
}

export const Canvas = <R extends WidgetRegistry = WidgetRegistry>(
    props: CanvasProps<R>,
) => {
    const {
        children,
        widgets,
        config = {
            blocks: {},
            queries: {},
        },
        onChange = () => null,
        onQuery = async () => ({
            data: null,
        }),
    } = props;

    // create the store if possible
    const canvas = useMemo(() => {
        const s = new CanvasStore(config, {
            onChange: onChange,
            onQuery: onQuery,
        });

        return s;
    }, [config]);

    if (!canvas) {
        return null;
    }

    return (
        <CanvasContext.Provider
            value={{
                widgets: widgets,
                canvas: canvas,
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
};
