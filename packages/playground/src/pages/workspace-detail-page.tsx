import {
	BookOpenIcon,
	EllipsisIcon,
	HammerIcon,
	MessagesSquareIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import logoImage from "@/assets/img/logo.svg";
import { WorkspaceChatList, WorkspaceMCPList } from "@/components";
import { useGlobalBreadcrumbs, useRoot } from "@/hooks";
import { useChat } from "@/hooks/use-chat";
import type { Workspace } from "@/types";

/**
 * Renders the Workspace Detail Page, displaying information about a specific workspace
 *
 * @component
 */
export const WorkspaceDetailPage = observer(() => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();

	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [tab, setTab] = useState<string>("chats");
	const [search, setSearch] = useState<string>("");

	const debouncedSearch = useDebouncedValue(search);

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
	useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
		{
			name: "Workspace",
			path: "/workspace",
		},
		{
			name:
				getWorkspace.status === "SUCCESS"
					? getWorkspace.data.name
					: "Loading",
			path: `/workspace/${workspaceId}`,
		},
	]);

	if (getWorkspace.status === "LOADING" || isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR") {
		return <Navigate to="/workspace" />;
	}

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-12 px-12 pt-8 pb-4">
				<div className="flex flex-row gap-2">
					<div className="items-center text-2xl">
						<img
							className="flex h-6 select-none flex-row items-center"
							alt="logo"
							src={root.theme?.images.logo || logoImage}
						/>
					</div>
					<div className="space-y-2.5">
						<div className="font-semibold text-2xl text-foreground leading-none">
							{getWorkspace.data?.name}
						</div>
						<div className="text-base text-muted-foreground">
							{getWorkspace.data?.description || ""}
						</div>
					</div>
					<div className="flex-1" />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								onClick={(e) => e.stopPropagation()}
							>
								<EllipsisIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuItem asChild>
									<Link to={`/workspace/${workspaceId}/edit`}>
										Edit
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={async (e) => {
										e.stopPropagation();

										setIsLoading(true);
										try {
											await chat.deleteWorkspace(
												workspaceId,
											);

											// go to the workspace
											navigate("/workspace");
										} catch (e) {
											toast.error(
												e instanceof Error
													? e.message
													: "Failed to delete workspace",
											);
										} finally {
											setIsLoading(false);
										}
									}}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					{/* <Button
								variant="outline"	
							>
								<PinIcon />
							</Button> */}
				</div>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value)}
					className="flex h-full w-full flex-1 flex-col items-start overflow-hidden rounded-xl border-border bg-card shadow-sm"
				>
					<div className="flex w-full flex-row gap-2 border-border bg-primary-foreground p-4">
						<TabsList>
							<TabsTrigger value="chats">
								<MessagesSquareIcon />
								My Chats
							</TabsTrigger>
							<TabsTrigger value="knowledge">
								<BookOpenIcon />
								Knowledge
							</TabsTrigger>
							<TabsTrigger value="toolbox">
								<HammerIcon />
								Toolbox
							</TabsTrigger>
						</TabsList>
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
						{/* <Button variant="outline">
								<ListFilterIcon />
								Filter
							</Button> */}
						<Button
							variant="default"
							onClick={() => {
								navigate(`/new?workspaceId=${workspaceId}`);
							}}
						>
							<PlusIcon />
							New Chat
						</Button>
					</div>

					<TabsContent
						value="chats"
						className="w-full overflow-hidden"
					>
						{tab === "chats" && (
							<WorkspaceChatList
								workspaceId={workspaceId}
								search={debouncedSearch}
							/>
						)}
					</TabsContent>
					<TabsContent
						value="knowledge"
						className="w-full overflow-hidden"
					>
						{tab === "knowledge" && (
							<WorkspaceMCPList
								type="KNOWLEDGE"
								mcp={getWorkspace.data?.mcp.filter(
									(mcp) => mcp.type === "VECTOR",
								)}
								search={debouncedSearch}
							/>
						)}
					</TabsContent>
					<TabsContent
						value="toolbox"
						className="w-full overflow-hidden"
					>
						{tab === "toolbox" && (
							<WorkspaceMCPList
								type="TOOLBOX"
								mcp={getWorkspace.data?.mcp.filter(
									(mcp) => mcp.type !== "VECTOR",
								)}
								search={debouncedSearch}
							/>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
});
