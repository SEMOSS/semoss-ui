import { Paths, PathValue } from '@/types';

import { Actions } from './state.actions';

/**
 * Block
 */
export type Block<D extends BlockDef = BlockDef> = D extends D
    ? {
          /** ID of the Block */
          id: string;

          /** Unique widget name */
          widget: D['widget'];

          /** Parent of the block */
          parent: {
              /** Parent ID of the block */
              id: string;

              /** Slot the block is in */
              slot: string;
          } | null;

          /** Data associated with the block */
          data: D['data'];

          /** Event listeners associated with the block */
          listeners: Record<keyof D['listeners'], Actions[]>;

          /** Slots associated with the block */
          slots: Record<
              D['slots'],
              {
                  /** Name of the slot */
                  name: D['slots'];
                  /** Children IDs of the slot */
                  children: string[];
              }
          >;
      }
    : never;

/**
 * Block Definition
 */
export interface BlockDef<W extends string = string> {
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
export interface BlockConfig<D extends BlockDef = BlockDef> {
    /** Unique widget name */
    widget: D['widget'];

    /** Data associated with the block */
    data: D['data'];

    /** Listeners associated with the block */
    listeners: D['listeners'];

    /** Children associated with the block */
    slots: Record<D['slots'], BlockJSON[]>;

    /** Render the block */
    render: BlockComponent;

    /** Settings Menu */
    menu: {
        name: string;
        children: {
            /** Description for the setting */
            description: string;
            /** Render the setting */
            render: BlockSettingsComponent;
        }[];
    }[];
}

/**
 * Component Innformation
 */
export type BlockComponent = (props: {
    /** Id of the block */
    id: string;
}) => JSX.Element;

/**
 * Block Settings Information
 */
export type BlockSettingsComponent = (props: {
    /** Id of the block */
    id: string;
}) => JSX.Element;

/**
 * JSON
 */
export type BlockJSON<
    T extends BlockDef = BlockDef,
    A extends BlockDef = BlockDef,
> = T extends BlockDef
    ? {
          /** Type of the widget */
          widget: T['widget'];

          /** Data associated with the widget */
          data: T['data'];

          /** Event listeners associated with the widget */
          listeners: Record<keyof T['listeners'], Actions[]>;

          /** Slot information */
          slots: Record<keyof T['slots'], BlockJSON<A, A>[]>;
      }
    : never;

/**
 * Registry
 */
export type Registry<D extends BlockDef = BlockDef> = D extends BlockDef
    ? Record<D['widget'], BlockConfig<D>>
    : never;

/**
 * Unwrap the Registry
 */
export type RegistryUnwrap<R extends Registry<BlockDef>> = R extends Registry<
    infer W
>
    ? W
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
