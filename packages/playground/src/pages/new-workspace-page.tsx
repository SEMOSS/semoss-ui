import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { ScrollArea } from "@semoss/ui/next";
import { WorkspaceForm } from "@/components";
import { useGlobalBreadcrumbs } from "@/hooks";

/**
 * Renders the NewWorkspacePage for creating new workspaces
 *
 * @component
 */
export const NewWorkspacePage = observer(() => {
	const { t } = useTranslation("workspace");
	const navigate = useNavigate();

	const scrollToTopOnMount = useCallback((node: HTMLDivElement | null) => {
		node?.scrollTo({ top: 0 });
	}, []);

	// set the breadcrumbs
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("breadcrumbs.home"),
				path: "/",
			},
			{
				name: t("breadcrumbs.agent"),
				path: "/agent",
			},
			{
				name: t("breadcrumbs.new"),
				path: "/agent/new",
			},
		],
	});

	const handleClose = (newWorkspaceId?: string) => {
		if (newWorkspaceId) {
			navigate(`/agent/${newWorkspaceId}`);
		} else {
			navigate("/agent");
		}
	};

	return (
		<ScrollArea
			className="relative h-full w-full overflow-hidden"
			viewportRef={scrollToTopOnMount}
		>
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-12 px-12 pt-8 pb-4">
				<div className="flex flex-row gap-2">
					<div className="space-y-2.5">
						<div className="font-semibold text-2xl text-foreground leading-none">
							{t("new.title")}
						</div>
						<div className="text-base text-muted-foreground">
							{t("new.subtitle")}
						</div>
					</div>
					<div className="flex-1" />
				</div>
				<WorkspaceForm isNew={true} onClose={handleClose} />
			</div>
		</ScrollArea>
	);
});
