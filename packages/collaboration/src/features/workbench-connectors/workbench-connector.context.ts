import { createContext, useContext } from "react";
import type { ConnectorViewerProps } from "@semoss/connectors";

/** The originating chat's connector actions; null while its insight is opening. */
export const WorkbenchConnectorContext =
	createContext<ConnectorViewerProps | null>(null);

/** Read the host contract without allocating a room just to browse an account. */
export function useWorkbenchConnectorHost(): ConnectorViewerProps | null {
	return useContext(WorkbenchConnectorContext);
}
