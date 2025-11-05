import { ComputerIcon, SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
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
import type { App } from "@/types";

/**
 * Renders the Discover Page, allowing users to discover and create workspaces
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	/**
	 * State
	 */
	const [search, setSearch] = useState("");
	const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] =
		useState<boolean>(false);
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);

	/**
	 * Library Hooks
	 */
	const debouncedSearch = useDebouncedValue(search);
	const listWorkspaces = usePixel<App[]>(
		`MyProjects ( type = "WORKSPACE" , filterWord = "${debouncedSearch}" ) ;`,
		{ data: [] },
	);
	const navigate = useNavigate();

	/**
	 * CreateRoom
	 */
	const createRoom = (workspaceId: string) =>
		navigate(`/new?workspaceId=${workspaceId}`);

	/**
	 * Constants
	 */
	const isLoading =
		listWorkspaces.status === "LOADING" || search !== debouncedSearch;

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
							`${listWorkspaces.data.length} results`
						)}
					</InputGroupAddon>
				</InputGroup>
			</div>
			<div className="mx-auto w-full max-w-5xl flex-1 pt-10">
				<ScrollArea className="h-full w-full">
					{isLoading && (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					)}

					{listWorkspaces.status === "SUCCESS" &&
						listWorkspaces.data.length > 0 && (
							<div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
								{listWorkspaces.data.map((w) => (
									<WorkspaceCard
										key={w.project_id}
										workspace={{
											workspace_id: w.project_id,
											name: w.project_name,
											description: w.description,
										}}
										onPrimaryClick={() =>
											createRoom(w.project_id)
										}
										onSecondaryClick={() => {
											setWorkspaceId(w.project_id);
											setIsWorkspaceModalOpen(true);
										}}
									/>
								))}
							</div>
						)}

					{listWorkspaces.status === "SUCCESS" &&
						listWorkspaces.data.length === 0 && (
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
