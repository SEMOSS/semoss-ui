import { useLocation } from "react-router-dom";

/** True only for the dedicated chromeless dashboard viewer route. */
export function useEmbedMode(): boolean {
	const location = useLocation();
	return /\/dashboard\/[^/]+\/view\/?$/.test(location.pathname);
}
