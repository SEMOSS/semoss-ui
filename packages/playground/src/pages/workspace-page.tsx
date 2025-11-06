import { ComputerIcon, SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Lead,
	Muted,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { WorkspaceCard } from "@/components";
import { WorkspaceOverlay } from "@/components/workspace/workspace-overlay";
import type { Workspace } from "@/types";

/**
 * Renders the Discover Page, allowing users to discover and create workspaces
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	/**
	 * Library Hooks
	 */
	const listWorkspaces = usePixel<{
		workspaces: Workspace[];
	}>(`ListWorkspaces();`, { data: { workspaces: [] } });

	const navigate = useNavigate();

	/**
	 * State
	 */
	const [search, setSearch] = useState("");
	const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] =
		useState<boolean>(false);
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);

	/**
	 * CreateRoom
	 */
	const createRoom = (workspaceId: string) =>
		navigate(`/new?workspaceId=${workspaceId}`);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden px-2">
			<div className="mx-auto w-full max-w-2xl">
				<H4 className="mt-16">Discover Workspaces</H4>
				<div className="mt-4 flex flex-row">
					<Lead className="flex-1 text-base">
						Explore and build custom AI workspaces designed to meet
						your unique needs and integrate seamlessly into your
						processes.
					</Lead>
					<Tooltip>
						<TooltipTrigger asChild>
							<span>
								<Button
									onClick={() => {
										setWorkspaceId(null);
										setIsWorkspaceModalOpen(true);
									}}
								>
									<ComputerIcon />
									Build
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>Create a new workspace</TooltipContent>
					</Tooltip>
				</div>
				<InputGroup className="mt-12">
					<InputGroupInput
						placeholder="Search Workspaces"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						{listWorkspaces.status === "LOADING" ? (
							<Spinner />
						) : (
							`${listWorkspaces.data.workspaces.length} results`
						)}
					</InputGroupAddon>
				</InputGroup>
			</div>
			<div className="mx-auto w-full max-w-5xl flex-1 pt-10">
				<ScrollArea className="h-full w-full">
					{listWorkspaces.status === "LOADING" && (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					)}

					{listWorkspaces.status === "SUCCESS" &&
						listWorkspaces.data.workspaces.length > 0 && (
							<div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
								{listWorkspaces.data.workspaces.map((w) => (
									<WorkspaceCard
										key={w.workspace_id}
										workspace={w}
										onPrimaryClick={() =>
											createRoom(w.workspace_id)
										}
										onSecondaryClick={() => {
											setWorkspaceId(w.workspace_id);
											setIsWorkspaceModalOpen(true);
										}}
									/>
								))}
							</div>
						)}

					{listWorkspaces.status === "SUCCESS" &&
						listWorkspaces.data.workspaces.length === 0 && (
							<div className="flex items-center justify-center py-12">
								<Muted>No results found</Muted>
							</div>
						)}
				</ScrollArea>
			</div>

			{isWorkspaceModalOpen && (
				<WorkspaceOverlay
					open={isWorkspaceModalOpen}
					workspaceId={workspaceId}
					onClose={(newWorkspaceId) => {
						setIsWorkspaceModalOpen(false);
						if (newWorkspaceId) {
							createRoom(newWorkspaceId);
						}
					}}
				/>
			)}
		</div>
	);
});
