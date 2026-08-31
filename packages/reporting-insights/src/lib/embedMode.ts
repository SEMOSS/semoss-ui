import { useLocation } from "react-router-dom";
import { isEmbedded } from "./embed";

/**
 * True when the app should render its chromeless "embed" UI. Three signals:
 *   • Path ends in `/view` — the dedicated read-only viewer route.
 *   • `?embed=1` query param (handled by {@link isEmbedded}).
 *   • The app is rendered inside an iframe (handled by {@link isEmbedded}).
 */
export function useEmbedMode(): boolean {
	const location = useLocation();
	if (/\/view$/.test(location.pathname)) return true;
	return isEmbedded();
}
