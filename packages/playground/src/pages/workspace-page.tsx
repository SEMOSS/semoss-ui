import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	SidebarTrigger,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import workspaceGraphic from "@/assets/img/workspace-graphic.png";
import { WorkspaceCard, WorkspaceOverlay } from "@/components";
import { useChat } from "@/hooks";
import type { App } from "@/types";

/**
 * Renders the WorkspacePage, allowing users to access their workspace or discover new ones
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
	const debouncedSearch = useDebouncedValue(search);

	const { chat } = useChat();

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`MyProjects(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} type = "WORKSPACE", limit=[${limit}], offset=[${offset}]);`,
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 25) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: 25,
		},
		[debouncedSearch],
	);

	/**
	 * Delete Workspace
	 */
	const handleDeleteWorkspace = async (workspaceId: string) => {
		try {
			await chat.deleteWorkspace(workspaceId);

			getWorkspaces.reset();
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to delete workspace",
			);
			return;
		}
	};

	/**
	 * Setup infinite scroll for the command list
	 */
	const setScroll = useInfiniteScroll({
		onNext: () => {
			if (getWorkspaces.isLoading || !getWorkspaces.hasMore) {
				return;
			}
			getWorkspaces.next();
		},
	});

	return (
		<div className="flex w-full flex-col px-2">
			<div className="absolute top-2 left-2 z-10 flex h-12.5 items-center px-4">
				<SidebarTrigger />
			</div>
			<div className="mx-auto flex h-screen w-full max-w-[950px] flex-col gap-12 px-12 pt-8 pb-4">
				<div className="flex w-full rounded-lg bg-sky-100">
					<div className="flex flex-1 flex-col gap-4 p-6 font-sans">
						<div className="font-medium text-primary text-xl leading-normal">
							Welcome to Workspace Manager
						</div>
						<div className="font-normal text-base text-primary leading-normal">
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
					<InputGroup className="bg-background">
						<InputGroupInput
							placeholder="Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>

					<ScrollArea
						className="flex-1 overflow-auto"
						viewportRef={(ele) => setScroll(ele)}
					>
						{getWorkspaces.data.length === 0 ? (
							<div className="flex items-center justify-center py-12">
								<Muted>No results found</Muted>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
								{getWorkspaces.data.map((w) => (
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
						)}

						{/* Loading more indicator */}
						{getWorkspaces.isLoading &&
							getWorkspaces.data.length > 0 && (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-4" />
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
							getWorkspaces.reset();
						}
					}}
				/>
			)}
		</div>
	);
});
