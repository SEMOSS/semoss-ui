import { AgentCatalogView } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { useIsDarkMode } from "@/hooks/use-is-dark-mode";
import { useRoot } from "@/hooks/use-root";

/**
 * The agent catalog, with the theme's illustration.
 *
 * @component
 */
export const WorkspacePage = () => {
	const { t } = useTranslation("workspace");
	const { root } = useRoot();
	const isDark = useIsDarkMode();
	const src = isDark
		? root.theme.images.workspaceDark
		: root.theme.images.workspace;

	return (
		<AgentCatalogView
			illustration={
				src ? (
					<img
						src={src}
						alt={t("images.agentIllustration")}
						className="max-h-32 w-full rounded-xl object-cover"
					/>
				) : null
			}
		/>
	);
};
