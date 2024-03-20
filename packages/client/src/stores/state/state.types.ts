import React from 'react';
import { RunQueryAction, DispatchEventAction } from './state.actions';
import { CellState } from './cell.state';
import { QueryStateConfig } from './query.state';

export type SerializedState = {
    /** Queries rendered in the insight */
    queries: Record<string, QueryStateConfig>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;
};

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
          listeners: Record<keyof D['listeners'], ListenerActions[]>;

          /** Slots associated with the block */
          slots: Record<
              keyof D['slots'],
              {
                  /** Name of the slot */
                  name: keyof D['slots'];
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
    slots: Record<string, true>;
}

/**
 * Block configuration
 */
export interface BlockConfig<D extends BlockDef = BlockDef> {
    /** Unique widget name */
    widget: D['widget'];

    /** Block type: BLOCK_TYPE_ACTION | BLOCK_TYPE_CHART | BLOCK_TYPE_DISPLAY | BLOCK_TYPE_INPUT | BLOCK_TYPE_LAYOUT | BLOCK_TYPE_DATA */
    type: string;

    /** Data associated with the block */
    data: D['data'];

    /** Listeners associated with the block */
    listeners: Record<keyof D['listeners'], ListenerActions[]>;

    /** Children associated with the block */
    slots: Record<keyof D['slots'], BlockJSON[]>;

    /** Render the block */
    render: BlockComponent;

    /** Icon to render in the builder sidebar */
    icon: React.FunctionComponent;

    /** *new* custom menu */
    menu?: BlockComponent;

    /** Content Menu */
    contentMenu?: {
        name: string;
        children: {
            /** Description for the setting */
            description: string;
            /** Render the setting */
            render: (props: {
                /** Id of the block */
                id: string;
            }) => JSX.Element;
        }[];
    }[];

    /** Style Menu */
    styleMenu?: {
        name: string;
        children: {
            /** Description for the setting */
            description: string;
            /** Render the setting */
            render: (props: {
                /** Id of the block */
                id: string;
            }) => JSX.Element;
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
 * JSON
 */
export type BlockJSON<
    T extends BlockDef = BlockDef,
    A extends BlockDef = BlockDef,
> = T extends BlockDef
    ? {
          /** Widget */
          widget: T['widget'];

          /** Data associated with the widget */
          data: T['data'];

          /** Event listeners associated with the widget */
          listeners: Record<keyof T['listeners'], ListenerActions[]>;

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
 * Listener Actions
 */
export type ListenerActions = RunQueryAction | DispatchEventAction;

/**
 * Cell Definition
 */
export interface CellDef<W extends string = string> {
    /** Unique widget name */
    widget: W;

    /** Parameters associated with the widget */
    parameters: Record<string, unknown>;
}

/**
 * Cell Registry
 */
export type CellRegistry<D extends CellDef = CellDef> = D extends CellDef
    ? Record<D['widget'], CellConfig<D>>
    : never;
/**
 * Component Information
 */
export type CellComponent<D extends CellDef = CellDef> =
    React.FunctionComponent<{
        /** Cell that is controlling the cell */
        cell: CellState<D>;
        /** Whether the content is expanded */
        isExpanded?: boolean;
    }>;

/**
 * Config Information
 */
export type CellConfig<D extends CellDef = CellDef> = {
    /** Nmae of the Cell */
    name: string;

    /** Unique widget name */
    widget: D['widget'];

    /** Component rendered in the view */
    view: CellComponent<D>;

    /** Parameters associated with the cell */
    parameters: D['parameters'];

    /** Method that to convert the cell into pixel */
    toPixel: (
        /** Parameters associated with the cell */
        parameters: D['parameters'],
    ) => string;
};

export type Template = {
    /** Name of the template */
    name: string;

    /** Description associated with the template */
    description: string;

    /** State associated with the template */
    state: SerializedState;

    /** Image for the template */
    image: string;

    /** Author for the template */
    author: string;

    /** Date updated template */
    lastUpdatedDate: string;

    /** Tags associated with the template */
    tags: string[];
};
