import { Actions } from './canvas.actions';
import React from 'react';

/**
 * Block
 */
export type Block<W extends Widget = Widget> = W extends W
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
 * Widget
 */
export interface Widget<W extends string = string> {
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
 * Config information for the widget
 */
export type WidgetConfig<W extends Widget = Widget> = {
    /** Unique widget name */
    widget: W['widget'];

    /**
     * Component to render the block
     */
    block: React.FunctionComponent<{
        /** Id of the block */
        id: string;
    }>;

    /** Default settings */
    config: {
        /** Data associated with the widget */
        data: WidgetJSON<W, W>['data'];

        /** Listeners associated with the widget */
        listeners: WidgetJSON<W, W>['listeners'];

        /** Children associated with the widget */
        slots: WidgetJSON<W, W>['slots'];
    };
};

/**
 * WidgetJSON
 */
export type WidgetJSON<
    T extends Widget = Widget,
    A extends Widget = Widget,
> = T extends Widget
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
export type WidgetRegistry<W extends Widget = Widget> = W extends Widget
    ? Record<Widget['widget'], WidgetConfig<W>>
    : never;
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
