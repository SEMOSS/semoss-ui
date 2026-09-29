import { useTranslation } from "@semoss/i18n";
import { ConnectionsOverview } from "@/features/teamwork/components/connections-overview";
import { useGlobalBreadcrumbs } from "@/hooks/use-global-breadcrumbs";

/**
 * The Connections page: the accounts and folders the assistant can work with.
 */
export const ConnectionsPage = () => {
	const { t } = useTranslation(["workspace", "teamwork"]);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{ name: t("teamwork:connections.title"), path: "/connections" },
		],
	});

	return <ConnectionsOverview />;
};
