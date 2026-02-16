import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@semoss/ui/next";
import { WorkspaceForm } from "@/components";
import { useGlobalBreadcrumbs } from "@/hooks";

/**
 * Renders the NewWorkspacePage for creating new workspaces
 *
 * @component
 */
export const NewWorkspacePage = observer(() => {
	const navigate = useNavigate();

	// set the breadcrumbs
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: "Home",
				path: "/",
			},
			{
				name: "Agent",
				path: "/agent",
			},
			{
				name: "New",
				path: "/agent/new",
			},
		],
	});

	const handleClose = (newWorkspaceId?: string) => {
		if (newWorkspaceId) {
			navigate(`/agent/${newWorkspaceId}`);
		} else {
			navigate("/workspace");
		}
	};

	return (
		<ScrollArea className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-12 px-12 pt-8 pb-4">
				<div className="flex flex-row gap-2">
					<div className="space-y-2.5">
						<div className="font-semibold text-2xl text-foreground leading-none">
							New Agent
						</div>
						<div className="text-base text-muted-foreground">
							Create a new agent to get started
						</div>
					</div>
					<div className="flex-1" />
				</div>
				<WorkspaceForm isNew={true} onClose={handleClose} />
			</div>
		</ScrollArea>
	);
});
