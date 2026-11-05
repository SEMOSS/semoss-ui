import { getLoginTypeName } from "@semoss/shared";
import { useConfig } from "@/hooks";
import { CUSTOM_TEAM_TYPE } from "./team-type";

/**
 * The name to show for where a team's members come from: "Custom", or the
 * login provider's display name, such as "Microsoft".
 *
 * @param type - CUSTOM, or the provider's label or key
 * @returns the server's name for the provider, the backend's usual name when
 * the server does not list it, or the type in title case
 */
export const useTeamTypeName = (type: string): string => {
	const providers = useConfig((state) => state.config.availableProviders);
	if (type === CUSTOM_TEAM_TYPE) {
		return "Custom";
	}
	const normalized = type.toUpperCase();
	const match = providers.find(
		(provider) =>
			(provider.label ?? provider.provider).toUpperCase() ===
				normalized || provider.provider.toUpperCase() === normalized,
	);
	return match?.name ?? getLoginTypeName(type);
};
