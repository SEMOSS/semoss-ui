import { createElement, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useInsight } from '@semoss/sdk';

import {
    CanvasStore,
    Block,
    Widget,
    WidgetRegistry,
    Query,
    ActionMessages,
} from '@/stores';
import { CanvasContext } from '@/contexts';
import { Error } from './Error';
import { Loading } from './Loading';
import { Unauthorized } from './Unauthorized';
import { Renderer } from './Renderer';

export interface CanvasProps<W extends Widget> {
    /** Content to render  */
    children?: React.ReactNode;

    /** Widgets available to all of the blocks */
    widgets: WidgetRegistry<W>;

    /** Current active block  */
    active?: string;

    /** Blocks that will be loaded into the canvas */
    blocks: Record<string, Block>;

    /** Queries that will be loaed into the canvas */
    queries?: Record<string, Query>;

    /** Callback that is triggered when the json changes */
    onChange?: (json: string) => void;

    /** Components to change default options */
    components?: {
        Error?: () => JSX.Element;
        Loading?: () => JSX.Element;
        Unauthorized?: () => JSX.Element;
    };
}

export const Canvas = observer(<W extends Widget>(props: CanvasProps<W>) => {
    const {
        children,
        widgets,
        active,
        blocks,
        queries = {},
        components,
    } = props;

    // use the exsiting
    const { insight } = useInsight();

    // create the store if possible
    const store = useMemo(() => {
        if (!insight.isInitialized || !insight.isAuthorized || !insight.error) {
            return null;
        }

        return new CanvasStore(insight);
    }, []);

    // set the state
    useEffect(() => {
        if (!store) {
            return;
        }

        // set the initial state
        store.dispatch({
            message: ActionMessages.SET_STATE,
            payload: {
                blocks: blocks,
                queries: queries,
            },
        });

        return;
    }, [store, blocks, queries]);

    // assumes that the insight is already initialized
    if (!store) {
        if (!insight.isInitialized) {
            return components && components.Loading ? (
                createElement(observer(components.Loading))
            ) : (
                <Loading />
            );
        }

        if (!insight.isAuthorized) {
            return components && components.Unauthorized ? (
                createElement(observer(components.Unauthorized))
            ) : (
                <Unauthorized />
            );
        }

        if (insight.error) {
            return components && components.Error ? (
                createElement(observer(components.Error))
            ) : (
                <Error />
            );
        }

        return <></>;
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
});
