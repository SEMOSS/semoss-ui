import { createContext, useContext } from "react";

export interface ConnectedEngine {
	engineId: string;
	engineName: string;
}

interface EngineConnectContextValue {
	engine: ConnectedEngine | null;
	setEngine: (engine: ConnectedEngine) => void;
}

export const EngineConnectContext = createContext<EngineConnectContextValue>({
	engine: null,
	setEngine: () => {},
});

/** The engine picked once via EngineConnectBar, shared by every
 * backend-connected demo on the components/playground site. */
export const useEngineConnect = () => useContext(EngineConnectContext);
