import type React from "react";
import type { CellState } from "./cell.state";
import type { QueryStateConfig } from "./query.state";
import type {
	DispatchEventAction,
	DispatchOpenEventAction,
	ModifyVariableAction,
	RunCellAction,
	RunQueryAction,
} from "./state.actions";

export type SerializedState = {
	/** What version the state store we currently are on link: https://semver.org/ */
	version: string;

	/** Queries rendered in the insight */
	queries: Record<string, QueryStateConfig>;

	/** Blocks rendered in the insight */
	blocks: Record<string, Block>;

	/** Variables used in notebook */
	variables: Record<string, Variable>;

	/** Order of how we consume app as api */
	executionOrder: string[];
};

/**
 * Variable Types
 */
export type VariableType =
	| "block"
	| "cell"
	| "query"
	| "string"
	| "number"
	| "database"
	| "model"
	| "vector"
	| "storage"
	| "function"
	| "JSON"
	| "date"
	| "array"
	| "LLM Comparison"; // TODO: Ignore and delete later

/**
 * Variables
 */
export type Variable =
	| {
			type: Exclude<VariableType, "cell">; // Exclude 'cell' from VariableType for this case
			to?: string;
			cellId?: never; // Explicitly setting it as never when 'type' is not 'cell'
			value?: any;
	  }
	| {
			to: string;
			type: "cell"; // Specific case when type is 'cell'
			cellId: string;
			value?: any;
	  };

export type VariableWithId =
	| ({
			type: Exclude<VariableType, "cell">;
			to?: string;
			value?: any;
			cellId?: string;
	  } & { id: string })
	| ({
			type: "cell";
			to: string;
			cellId: string;
	  } & { id: string });

/**
 * Frame
 */
export type Frame = {
	/** Name of the frame */
	name: string;

	/** Key associated with the frame, it changes whenever the data changes */
	key: number;
};

/**
 * Variants
 */
export type Variant = {
	id: string;
	sortWeight: number;
	model: VariantModel;
};

export type VariantModel = {
	id: string;
	name: string;
	topP: number;
	temperature: number;
	length: number;
};

/**
 * Block
 */
export type Block<D extends BlockDef = BlockDef> = D extends D
	? {
			/** ID of the Block */
			id: string;

			/** Unique widget name */
			widget: D["widget"];

			/** Parent of the block */
			parent?: {
				/** Parent ID of the block */
				id: string;

				/** Slot the block is in */
				slot: string;
			} | null;

			/** Data associated with the block */
			data: D["data"];

			/** Event listeners associated with the block */
			listeners: Record<
				keyof D["listeners"],
				{ order: ListenerActions[]; type: "sync" | "async" }
			>;

			/** Slots associated with the block */
			slots: Record<
				keyof D["slots"],
				{
					/** Name of the slot */
					name: keyof D["slots"];
					/** Children IDs of the slot */
					children: string[];
				}
			>;

			/** Mapping of community block ID to local block ID */
			communityBlockMapping?: Record<string, string>;
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
	listeners: Record<
		string,
		{ order: ListenerActions[]; type: "sync" | "async" }
	>;

	/** Names of the slot associated with the widget */
	slots: Record<string, true>;
}

/**
 * Block configuration
 */
export interface BlockConfig<D extends BlockDef = BlockDef> {
	/** Unique widget name */
	widget: D["widget"];

	/** Block type: BLOCK_TYPE_ACTION | BLOCK_TYPE_CHART | BLOCK_TYPE_DISPLAY | BLOCK_TYPE_INPUT | BLOCK_TYPE_LAYOUT | BLOCK_TYPE_DATA */
	type: string;

	/** Data associated with the block */
	data: D["data"];

	/** Listeners associated with the block */
	listeners: Record<
		keyof D["listeners"],
		{ order: ListenerActions[]; type: "sync" | "async" }
	>;

	/** Children associated with the block */
	slots: Record<keyof D["slots"], BlockJSON[]>;

	/** Render the block */
	render: BlockComponent;
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
			widget: T["widget"];

			/** Data associated with the widget */
			data: T["data"];

			/** Event listeners associated with the widget */
			listeners: Record<
				keyof T["listeners"],
				{ order: ListenerActions[]; type: "sync" | "async" }
			>;

			/** Slot information */

			slots: Record<keyof T["slots"], BlockJSON<A, A>[]>;

			/** Source ID of the community block */
			id?: string;
		}
	: never;

/**
 * Registry
 */
export type Registry<D extends BlockDef = BlockDef> = D extends BlockDef
	? Record<D["widget"], BlockConfig<D>>
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
export type ListenerActions =
	| RunQueryAction
	| DispatchEventAction
	| RunCellAction
	| DispatchOpenEventAction
	| ModifyVariableAction;

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
	? Record<D["widget"], CellConfig<D>>
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
		/** Model to use for code help */
		agentModelEngine?: string;
	}>;

/**
 * Config Information
 */
export type CellConfig<D extends CellDef = CellDef> = {
	/** Nmae of the Cell */
	name: string;

	/** Unique widget name */
	widget: D["widget"];

	/** Component rendered in the view */
	view: CellComponent<D>;

	/** Parameters associated with the cell */
	parameters: D["parameters"];

	/** Method that to convert the cell into pixel */
	toPixel: (
		/** Parameters associated with the cell */
		parameters: D["parameters"],
	) => string | string[];
};
