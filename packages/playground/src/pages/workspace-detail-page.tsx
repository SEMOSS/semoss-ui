import {
	EllipsisIcon,
	HammerIcon,
	MessagesSquareIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Separator,
	SidebarTrigger,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import {
	WorkspaceChatList,
	WorkspaceMCPList,
	WorkspaceOverlay,
} from "@/components";
import { useChat } from "@/hooks/useChat";
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

	const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
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
		<>
			<div className="flex h-full w-full flex-col overflow-hidden">
				{/* Header */}
				<div className="flex h-12.5 w-full flex-row items-center px-4">
					<div className="flex flex-row items-center justify-center gap-1.5">
						<SidebarTrigger />
						<Separator
							orientation="vertical"
							style={{ height: "17px" }}
						/>

						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href="#/workspace">
										Workspaces
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage
										title={getWorkspace.data?.name}
										className="max-w-100 truncate text-foreground"
									>
										{getWorkspace.data?.name}
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<div className="flex-1" />
				</div>
				<Separator />

				<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-hidden px-9 py-4 pt-20">
					<div className="flex flex-row gap-2">
						<div className="text-2xl">🌴</div>
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
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											setIsEditModalOpen(true);
										}}
									>
										Edit
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
								<TabsTrigger value="mcps">
									<HammerIcon />
									MCPs
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
							className="w-full overflow-auto"
						>
							{tab === "chats" && (
								<WorkspaceChatList
									workspaceId={workspaceId}
									search={debouncedSearch}
								/>
							)}
						</TabsContent>
						<TabsContent
							value="mcps"
							className="w-full overflow-auto"
						>
							{tab === "mcps" && (
								<WorkspaceMCPList
									mcp={getWorkspace.data?.mcp}
									search={debouncedSearch}
								/>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* Edit Modal */}
			{isEditModalOpen && (
				<WorkspaceOverlay
					open={isEditModalOpen}
					workspaceId={workspaceId}
					onClose={(shouldRefresh) => {
						// close it
						setIsEditModalOpen(false);

						if (shouldRefresh) {
							getWorkspace.refresh();
						}
					}}
				/>
			)}
		</>
	);
});
