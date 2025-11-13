import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	Spinner,
	toast,
	useDebouncedValue,
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
	const { chat } = useChat();

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
		<div className="flex w-full flex-col px-2">
			<div className="mx-auto flex h-screen w-full max-w-[950px] flex-col gap-12 px-4 pt-8 pb-4">
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
							className="w-auto"
						>
							Create a Workspace
						</Button>
					</div>
					{/* Image appears only on large screens and above */}
					<div className="relative hidden w-[351px] overflow-hidden rounded-r-lg lg:block">
						<img
							src={workspaceGraphic}
							alt="Workspace illustration"
							className="-translate-y-1/2 absolute top-1/2 left-0 h-[351px] w-full object-cover"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-4 overflow-auto">
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

					<ScrollArea className="flex-1 overflow-auto">
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Spinner />
							</div>
						) : listWorkspaces.data.length > 0 ? (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
								{listWorkspaces.data.map((w) => (
									<WorkspaceCard
										key={w.project_id}
										workspace={{
											workspace_id: w.project_id,
											name: w.project_name,
											description: w.description,
										}}
										onEditClick={() => {
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
			</div>

			{isWorkspaceModalOpen && (
				<WorkspaceOverlay
					open={isWorkspaceModalOpen}
					workspaceId={workspaceId}
					onClose={(newWorkspaceId) => {
						setIsWorkspaceModalOpen(false);
						if (newWorkspaceId) {
							listWorkspaces.refresh();
						}
					}}
				/>
			)}
		</div>
	);
});
