import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import { ScrollArea, Spinner, toast } from "@semoss/ui/next";
import { WorkspaceForm } from "@/components";
import { useGlobalBreadcrumbs } from "@/hooks";
import type { Workspace } from "@/types";

/**
 * Renders the EditWorkspacePage for editing existing workspaces
 *
 * @component
 */
export const EditWorkspacePage = observer(() => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();

	// Fetch workspace details
	const getWorkspace = usePixel<Workspace>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					`Failed to load workspace: ${e instanceof Error ? e.message : "Unknown error"}`,
				);
			},
		},
	);

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
				name:
					getWorkspace.status === "SUCCESS"
						? getWorkspace.data.name
						: "Loading",
				path: `/agent/${workspaceId}`,
			},
			{
				name: "Edit",
				path: `/agent/${workspaceId}/edit`,
			},
		],
	});

	const handleClose = (shouldRefresh?: string) => {
		if (shouldRefresh) {
			navigate(`/agent/${workspaceId}`);
		} else {
			navigate(`/agent/${workspaceId}`);
		}
	};

	if (getWorkspace.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR") {
		return (
			<div className="relative h-full w-full overflow-hidden">
				<div className="mx-auto flex h-full w-full max-w-[950px] flex-col gap-8 px-12 pt-8 pb-4">
					<div>
						<h1 className="font-semibold text-2xl">
							Error Loading Agent
						</h1>
						<p className="text-base text-muted-foreground">
							Failed to load the agent details
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-12 px-12 pt-8 pb-4">
				<div className="flex flex-row gap-2">
					<div className="space-y-2.5">
						<div className="font-semibold text-2xl text-foreground leading-none">
							Edit Agent
						</div>
						<div className="text-base text-muted-foreground">
							Update your agent details
						</div>
					</div>
					<div className="flex-1" />
				</div>

				<WorkspaceForm
					isNew={false}
					values={getWorkspace.data}
					onClose={handleClose}
				/>
			</div>
		</ScrollArea>
	);
});
