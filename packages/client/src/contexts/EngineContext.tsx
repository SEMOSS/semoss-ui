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
		engine_subtype?: string;

		/** refreshes metadata for the active engine */
		refresh: () => void;

		/** Additional metadata fields */
		engine_created_by?: string;
		engine_date_created?: string;
		last_updated?: string;
	};
};

/**
 * Context
 */
export const EngineContext = createContext<EngineContextType>(undefined);
