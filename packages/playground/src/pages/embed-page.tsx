import { observer } from "mobx-react-lite";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { RootStore } from "@/stores";

/**
 * Sets breadcrumbs for the active embed route.
 * The actual iframe is rendered (and kept alive) by MainLayoutContent.
 */
export const EmbedPage: React.FC = observer(() => {
	const { t } = useTranslation("workspace");
	const { path } = useParams();
	const { root } = useRoot();

	let matched: RootStore["theme"]["sidebar"]["headerItems"][number] = null;
	for (const item of root.theme.sidebar.headerItems) {
		if (item.path === path) {
			matched = item;
			break;
		}
	}

	if (!matched) {
		for (const item of root.theme.sidebar.footerItems) {
			if (item.path === path) {
				matched = item;
				break;
			}
		}
	}

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("breadcrumbs.home"),
				path: "/",
			},
			{
				name: matched?.name ?? path,
				path: `/embed/${path}`,
			},
		],
	});

	if (!matched) {
		return <Navigate to="/" replace />;
	}

	return null;
});
