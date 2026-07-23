import { createContext } from "react";
import type { Engine, Role } from "@semoss/shared";
import type { ENGINE_TYPES } from "@/types";

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

	/** Current Engine */
	engine: Engine;

	/** Current Permission */
	permission: Role;

	/** refreshes metadata for the active engine */
	refresh: () => void;
};

/**
 * Context
 */
export const EngineContext = createContext<EngineContextType | undefined>(
	undefined,
);
