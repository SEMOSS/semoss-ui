import { Actions } from './canvas.actions';
import React from 'react';
import { CanvasStore } from './canvas.store';

/**
 * Initial config to pass into the canvas
 */
export interface CanvasConfig<R extends WidgetRegistry> {
    /** Blocks that will be loaded into the canvas */
    blocks: Record<string, Block<WidgetRegistryUnwrap<R>>>;

    /** Queries that will be loaed into the canvas */
    queries?: Record<string, Query>;
}

/**
 * Block
 */
export type Block<W extends WidgetDef = WidgetDef> = W extends W
    ? {
          /** ID of the Block */
          id: string;

          /** Widget type of the Block */
          widget: W['widget'];

          /** Parent of the block */
          parent: {
              /** Parent ID of the block */
              id: string;

              /** Slot the block is in */
              slot: string;
          } | null;

          /** Data associated with the block */
          data: W['data'];

          /** Event listeners associated with the block */
          listeners: Record<keyof W['listeners'], Actions[]>;

          /** Slots associated with the block */
          slots: Record<
              W['slots'],
              {
                  /** Name of the slot */
                  name: W['slots'];
                  /** Children IDs of the slot */
                  children: string[];
              }
          >;
      }
    : never;

/**
 * Widget Definition
 */
export interface WidgetDef<W extends string = string> {
    /** Unique widget name */
    widget: W;

    /** Data associated with the widget */
    data: Record<string, unknown>;

    /** Listeners associated with the widget */
    listeners: Record<string, true>;

    /** Names of the slot associated with the widget */
    slots: string;
}

/**
 * Component Innformation
 */
export type Widget<W extends WidgetDef> = React.FunctionComponent<{
    /** Id of the block */
    id: string;
}> & {
    /** Unique widget name */
    widget: W['widget'];

    /** Default settings */
    config: {
        /** Data associated with the widget */
        data: W['data'];

        /** Listeners associated with the widget */
        listeners: W['listeners'];

        /** Children associated with the widget */
        slots: Record<W['slots'], WidgetJSON[]>;
    };
};

/**
 * WidgetJSON
 */
export type WidgetJSON<
    T extends WidgetDef = WidgetDef,
    A extends WidgetDef = WidgetDef,
> = T extends WidgetDef
    ? {
          /** Type of the widget */
          widget: T['widget'];

          /** Data associated with the widget */
          data: T['data'];

          /** Event listeners associated with the widget */
          listeners: Record<keyof T['listeners'], Actions[]>;

          /** Slot information */
          slots: Record<keyof T['slots'], WidgetJSON<A, A>[]>;
      }
    : never;

/**
 * WidgetRegistry
 */
export type WidgetRegistry<W extends WidgetDef = WidgetDef> =
    W extends WidgetDef ? Record<W['widget'], Widget<W>> : never;

/**
 * Unwrap the WidgetRegistry
 */
export type WidgetRegistryUnwrap<R extends WidgetRegistry<WidgetDef>> =
    R extends WidgetRegistry<infer W> ? W : never;

/**
 * Query
 */
export type Query = {
    /** ID of the Query */
    id: string;

    /** Track if the query has initialized */
    isInitialized: boolean;

    /** Track if the query is loading */
    isLoading: boolean;

    /** Track if the query has errored */
    error: Error | null;

    /** Query that will execute */
    query: string;

    /** Current data of the Query */
    data: unknown;
};

export type Callbacks = {
    /**
     * onChange Callback that is triggered after an action is fired
     */
    onChange: (event: {
        action: Actions;
        store: CanvasStore;
        error: Error | null;
    }) => void;

    /**
     * onQuery callback that is triggered after a query has been ran
     */
    onQuery: (event: { query: string; store: CanvasStore }) => Promise<{
        data: unknown;
    }>;
};
