import { createContext } from "react";
import type { ENGINE_TYPES, Role } from "@/types";

/**
 * Value
 */
export type EngineContextType = {
	/** Type of the engine */
	type: ENGINE_TYPES;

	/** Name of the type */
	name: string;

	/** Path of the type */
	path: string;

	/** Active engine information */
	active: {
		/** ID of the engine to load */
		id: string;

		/** User's role associated with the engine */
		role: Role;

		/** Name of the engine */
		name: string;

		/** metadata to show on detail pages */
		metadata: Record<string, unknown>;
		database_subtype?: string;

		/** refreshes metadata for the active engine */
		refresh: () => void;

		/** Additional metadata fields */
        database_created_by?: string;
        PERMISSIONGRANTEDBY?: string;
        DATEADDED?: string;
	};
};

/**
 * Context
 */
export const EngineContext = createContext<EngineContextType>(undefined);
