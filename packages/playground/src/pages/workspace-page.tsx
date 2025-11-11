import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	Spinner,
	toast,
} from "@semoss/ui/next";
import workspaceGraphic from "@/assets/img/workspace-graphic.png";
import { WorkspaceCard, WorkspaceOverlay } from "@/components";
import { useChat } from "@/hooks";
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
	const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);

	/**
	 * Library Hooks
	 */
	const debouncedSearch = useDebouncedValue(search);
	const listWorkspaces = usePixel<App[]>(
		`MyProjects ( type = "WORKSPACE" , filterWord = "${debouncedSearch}", limit = 10 ) ;`,
		{ data: [] },
	);
	const navigate = useNavigate();
	const { chat } = useChat();

	/**
	 * CreateRoom
	 */
	const createRoom = (workspaceId: string) =>
		navigate(`/new?workspaceId=${workspaceId}`);

	/**
	 * Delete Workspace
	 */
	const handleDeleteWorkspace = async (workspaceId: string) => {
		setIsLoadingDelete(true);
		try {
			await chat.deleteWorkspace(workspaceId);
			listWorkspaces.refresh();
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to delete workspace",
			);
			setIsLoadingDelete(false);
			return;
		}
		setIsLoadingDelete(false);
	};

	/**
	 * Constants
	 */
	const isLoading =
		listWorkspaces.status !== "SUCCESS" ||
		search !== debouncedSearch ||
		isLoadingDelete;

	return (
		<div className="flex h-full w-full flex-col overflow-hidden px-2">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pt-8 pb-4">
				<div className="flex w-full rounded-lg bg-sky-100">
					<div className="flex flex-1 flex-col gap-4 p-6 font-sans">
						<div className="font-medium text-blue-700 text-xl leading-normal">
							Welcome to Workspace Manager
						</div>
						<div className="font-normal text-base text-blue-700 leading-normal">
							Explore custom AI workspaces designed to meet your
							unique needs and integrate seamlessly into your
							processes.
						</div>
						<Button
							onClick={() => {
								setWorkspaceId(null);
								setIsWorkspaceModalOpen(true);
							}}
						>
							Create a Workspace
						</Button>
					</div>
					<div className="relative w-[351px] shrink-0 overflow-hidden rounded-r-lg">
						<img
							src={workspaceGraphic}
							alt="Workspace illustration"
							className="-translate-y-1/2 absolute top-1/2 left-0 h-[351px] w-full object-cover"
						/>
					</div>
				</div>

				<InputGroup>
					<InputGroupInput
						placeholder="Search Workspaces"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						{isLoading ? (
							<Spinner />
						) : (
							`${listWorkspaces.data.length} results`
						)}
					</InputGroupAddon>
				</InputGroup>

				<ScrollArea className="h-full w-full">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					) : listWorkspaces.data.length > 0 ? (
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
									onDeleteClick={() =>
										handleDeleteWorkspace(w.project_id)
									}
								/>
							))}
						</div>
					) : (
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
