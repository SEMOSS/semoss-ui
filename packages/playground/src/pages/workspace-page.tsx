import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
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
	useInfiniteScroll,
} from "@semoss/ui/next";
import workspaceImage from "@/assets/img/workspace.png";
import { WorkspaceCard } from "@/components";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { App } from "@/types";

/**
 * Renders the WorkspacePage, allowing users to access their workspace or discover new ones
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	const { root } = useRoot();
	const navigate = useNavigate();
	// set the breadcrumbs
	useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
		{
			name: "Workspace",
			path: "/workspace",
		},
	]);

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const { chat } = useChat();

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`MyProjects(metaKeys = ${JSON.stringify([
				"description",
			])}, type = "WORKSPACE", limit=[${limit}], offset=[${offset}]);`,
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
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-12 px-12 pt-8 pb-4">
				<div className="flex w-full rounded-lg bg-primary/10">
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
							onClick={() => navigate("/workspace/new")}
							className="w-auto"
						>
							Create a Workspace
						</Button>
					</div>
					{/* Image appears only on large screens and above */}
					<div className="relative hidden w-[351px] overflow-hidden rounded-r-lg lg:block">
						<img
							src={root.theme.images.workspace || workspaceImage}
							alt="Workspace illustration"
							className="-translate-y-1/2 absolute top-1/2 left-0 h-[351px] w-full select-none object-cover"
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
										onDeleteClick={async () => {
											try {
												await chat.deleteWorkspace(
													w.project_id,
												);

												getWorkspaces.reset();
											} catch (e) {
												toast.error(
													e instanceof Error
														? e.message
														: "Failed to delete workspace",
												);
											}
										}}
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
		</div>
	);
});
