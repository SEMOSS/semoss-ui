import type { CellStateConfig } from "./cell.state";
import type { QueryStateConfig } from "./query.state";
import type {
	BlockJSON,
	ListenerActions,
	SerializedState,
	VariableType,
	VariableWithId,
} from "./state.types";

export enum ActionMessages {
	/**
	 * All
	 */
	SET_STATE = "SET_STATE",
	ADD_VARIABLE = "ADD_VARIABLE",
	RENAME_VARIABLE = "RENAME_VARIABLE",
	EDIT_VARIABLE = "EDIT_VARIABLE",
	DELETE_VARIABLE = "DELETE_VARIABLE",
	SET_SHEET_EXECUTION_ORDER = "SET_SHEET_EXECUTION_ORDER",
	/**
	 * Blocks
	 */
	ADD_BLOCK = "ADD_BLOCK",
	MOVE_BLOCK = "MOVE_BLOCK",
	REMOVE_BLOCK = "REMOVE_BLOCK",
	SET_BLOCK_DATA = "SET_BLOCK_DATA",
	DELETE_BLOCK_DATA = "DELETE_BLOCK_DATA",
	SET_LISTENER = "SET_LISTENER",
	ADD_DYNAMIC_SLOT = "ADD_DYNAMIC_SLOT",
	REMOVE_DYNAMIC_SLOT = "REMOVE_DYNAMIC_SLOT",
	/**
	 * Notebook
	 */
	SET_QUERY = "SET_QUERY",
	NEW_QUERY = "NEW_QUERY",
	NEW_CELL = "NEW_CELL",
	MOVE_CELL = "MOVE_CELL",
	DELETE_QUERY = "DELETE_QUERY",
	DELETE_CELL = "DELETE_CELL",
	UPDATE_QUERY = "UPDATE_QUERY",
	UPDATE_CELL = "UPDATE_CELL",
	MAKE_CELL_MCP = "MAKE_CELL_MCP",
	/**
	 * Events
	 */
	RUN_CELL = "RUN_CELL",
	RUN_QUERY = "RUN_QUERY",
	DISPATCH_EVENT = "DISPATCH_EVENT",
	DISPATCH_OUTPUTS_EVENT = "DISPATCH_OUTPUTS_EVENT",
	DISPATCH_OPEN_EVENT = "DISPATCH_OPEN_EVENT",
	MODIFY_VARIABLE = "MODIFY_VARIABLE",
}

export type Actions =
	| SetStateAction
	| AddBlockAction
	| MoveBlockAction
	| RemoveBlockAction
	| SetBlockDataAction
	| DeleteBlockDataAction
	| SetListenerAction
	| NewQueryAction
	| DeleteQueryAction
	| UpdateQueryAction
	| RunQueryAction
	| NewCellAction
	| MoveCellAction
	| DeleteCellAction
	| UpdateCellAction
	| MakeCellMCPAction
	| RunCellAction
	| RemoveDynamicSlotAction
	| AddDynamicSlotAction
	| DispatchEventAction
	| DispatchOpenEventAction
	| AddVariableAction
	| RenameVariableAction
	| EditVariableAction
	| DeleteVariableAction
	| SetSheetExecutionOrderAction
	| ModifyVariableAction;

/**
 * All
 */
export interface Action {
	message: string;
	payload: Record<string, unknown>;
}

export interface SetStateAction extends Action {
	message: ActionMessages.SET_STATE;
	payload: {
		state?: SerializedState;
	};
}

export interface AddVariableAction extends Action {
	message: ActionMessages.ADD_VARIABLE;
	payload: {
		id: string;
		type: VariableType;
		to?: string;
		cellId?: string;
		value?: string;
		isInput?: boolean;
		isOutput?: boolean;
	};
}

export interface EditVariableAction extends Action {
	message: ActionMessages.EDIT_VARIABLE;
	payload: {
		id: string;
		from: VariableWithId;
		to: {
			type: VariableType;
			to?: string;
			cellId?: string;
			value?: string;
			isInput?: boolean;
			isOutput?: boolean;
		};
	};
}

export interface RenameVariableAction extends Action {
	message: ActionMessages.RENAME_VARIABLE;
	payload: {
		id: string;
		alias: string;
	};
}

export interface DeleteVariableAction extends Action {
	message: ActionMessages.DELETE_VARIABLE;
	payload: {
		id: string;
	};
}

export interface SetSheetExecutionOrderAction extends Action {
	message: ActionMessages.SET_SHEET_EXECUTION_ORDER;
	payload: {
		list: string[];
	};
}

/**
 * Blocks
 */
export interface AddBlockAction extends Action {
	message: ActionMessages.ADD_BLOCK;
	payload: {
		json: BlockJSON;
		position?:
			| null
			| { parent: string; slot: string }
			| {
					parent: string;
					slot: string;
					type: "before";
					sibling: string;
			  }
			| {
					parent: string;
					slot: string;
					type: "after";
					sibling: string;
			  };
		isCommunity?: boolean; // Optional flag to indicate if the block is community-based
		communityBlockDependents?: {
			queries?: Record<string, QueryStateConfig>;
			variables?: Record<string, VariableWithId>;
		};
	};
}

export interface MoveBlockAction extends Action {
	message: ActionMessages.MOVE_BLOCK;
	payload: {
		id: string;
		position?:
			| null
			| { parent: string; slot: string }
			| {
					parent: string;
					slot: string;
					type: "before";
					sibling: string;
			  }
			| {
					parent: string;
					slot: string;
					type: "after";
					sibling: string;
			  };
	};
}

export interface RemoveBlockAction extends Action {
	message: ActionMessages.REMOVE_BLOCK;
	payload: {
		id: string;
		keep: boolean;
	};
}

export interface SetBlockDataAction extends Action {
	message: ActionMessages.SET_BLOCK_DATA;
	payload: {
		id: string;
		path: string | null;
		value: unknown;
	};
}

export interface DeleteBlockDataAction extends Action {
	message: ActionMessages.DELETE_BLOCK_DATA;
	payload: {
		id: string;
		path: string | null;
	};
}

export interface SetListenerAction extends Action {
	message: ActionMessages.SET_LISTENER;
	payload: {
		id: string;
		listener: string;
		actions: ListenerActions[];
		type: "sync" | "async";
	};
}

export interface AddDynamicSlotAction extends Action {
	message: ActionMessages.ADD_DYNAMIC_SLOT;
	payload: {
		id: string;
	};
}

export interface RemoveDynamicSlotAction extends Action {
	message: ActionMessages.REMOVE_DYNAMIC_SLOT;
	payload: {
		id: string;
		indexToRemove: number;
	};
}

/**
 * Notebook
 */

export interface NewQueryAction extends Action {
	message: ActionMessages.NEW_QUERY;
	payload: {
		queryId: string;
		config: Omit<QueryStateConfig, "id">;
		isCommunity?: boolean; // Optional flag to indicate if the query is community-based
	};
}

export interface DeleteQueryAction extends Action {
	message: ActionMessages.DELETE_QUERY;
	payload: {
		queryId: string;
	};
}

export interface UpdateQueryAction extends Action {
	message: ActionMessages.UPDATE_QUERY;
	payload: {
		queryId: string;
		path: string | null;
		value: unknown;
	};
}

export interface NewCellAction extends Action {
	message: ActionMessages.NEW_CELL;
	payload: {
		queryId: string;
		previousCellId: string;
		config: Omit<CellStateConfig, "id">;
	};
}

export interface MoveCellAction extends Action {
	message: ActionMessages.MOVE_CELL;
	payload: {
		queryId: string;
		activeCellId: string;
		overCellId: string;
	};
}

export interface DeleteCellAction extends Action {
	message: ActionMessages.DELETE_CELL;
	payload: {
		queryId: string;
		cellId: string;
	};
}

export interface UpdateCellAction extends Action {
	message: ActionMessages.UPDATE_CELL;
	payload: {
		queryId: string;
		cellId: string;
		path: string | null;
		value: unknown;
	};
}

export interface MakeCellMCPAction extends Action {
	message: ActionMessages.MAKE_CELL_MCP;
	payload: {
		queryId: string;
		cellId: string;
		parameters: {
			name: string;
			projectId: string;
			params: {};
			// What if you want to go back and see code you originally made, meaning you dont want to write out a new cell you just want to go back and edit
			originalParams: Record<string, unknown>;
			paramType: string;
		};
	};
}

/**
 * Events
 */

export interface DispatchOpenEventAction extends Action {
	message: ActionMessages.DISPATCH_OPEN_EVENT;
	payload: {
		destinationType: string;
		destination: string;
	};
}

export interface DispatchEventAction extends Action {
	message: ActionMessages.DISPATCH_EVENT;
	payload: {
		name: string;
		detail?: Record<string, unknown>;
	};
}

export interface RunQueryAction extends Action {
	message: ActionMessages.RUN_QUERY;
	payload: {
		queryId: string;
	};
}

export interface RunCellAction extends Action {
	message: ActionMessages.RUN_CELL;
	payload: {
		queryId: string;
		cellId: string;
	};
}

export interface ModifyVariableAction extends Action {
	message: ActionMessages.MODIFY_VARIABLE;
	payload: {
		blockId: string;
		variable: string;
		value: unknown;
	};
}
