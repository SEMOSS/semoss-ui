import { CanvasStore, WidgetRegistry } from '@/stores';
import { CanvasContext } from '@/contexts';

export interface CanvasProps<R extends WidgetRegistry> {
    /** Content to render  */
    children: React.ReactNode;

    /** Canvas to connect to */
    canvas: CanvasStore;

    /** Widgets available to all of the blocks */
    widgets: R;
}

export const Canvas = <R extends WidgetRegistry = WidgetRegistry>(
    props: CanvasProps<R>,
) => {
    const {
        children,
        widgets,
        canvas = new CanvasStore(
            {
                blocks: {},
                queries: {},
            },
            {
                onQuery: async () => ({
                    data: null,
                }),
            },
        ),
    } = props;

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
