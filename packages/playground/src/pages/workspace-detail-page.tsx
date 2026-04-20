import {
	BookOpenIcon,
	EllipsisIcon,
	HammerIcon,
	MessagesSquareIcon,
	PlusIcon,
	SearchIcon,
	UsersRound,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import { MembersTable } from "@semoss/shared";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
	const { t } = useTranslation(["workspace", "common"]);

	/**
	 * Library Hooks
	 */
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tab, setTab] = useState<string>("chats");
	const [search, setSearch] = useState<string>("");
	const [deleteModal, setDeleteModal] = useState<boolean>(false);

	/**
	 * Library Hooks
	 */
	const debouncedSearch = useDebouncedValue(search);

	// Fetch workspace details
	const getWorkspace = usePixel<Workspace>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					t("workspace:detail.failedToLoad", {
						error: e instanceof Error ? e.message : "Unknown error",
					}),
				);
			},
		},
	);

	// set the breadcrumbs
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
			{
				name: t("workspace:breadcrumbs.agent"),
				path: "/agent",
			},
			{
				name:
					getWorkspace.status === "SUCCESS"
						? getWorkspace.data.name
						: t("workspace:breadcrumbs.loading"),
				path: `/agent/${workspaceId}`,
			},
		],
	});

	if (getWorkspace.status === "LOADING" || isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR") {
		return <Navigate to="/agent" />;
	}

	return (
		<div
			className={cn(
				"relative",
				tab !== "members" && "h-full",
				"w-full overflow-hidden",
			)}
		>
			<div
				className={cn(
					"mx-auto flex",
					tab !== "members" && "h-full",
					tab === "members" && "px-4",
					"w-full max-w-5xl flex-col gap-6 px-12 pt-8 pb-4",
				)}
			>
				<div className="flex flex-row gap-2">
					<div className="items-center text-2xl">
						<img
							className="flex h-6 select-none flex-row items-center"
							alt={t("common:images.logoAlt")}
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
									<Link to={`/agent/${workspaceId}/edit`}>
										{t("workspace:actions.edit")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={async (e) => {
										e.stopPropagation();
										setDeleteModal(true);
										setIsLoading(true);
										try {
											await chat.deleteWorkspace(
												workspaceId,
											);

											// go to the workspace
											navigate("/agent");
										} catch (e) {
											toast.error(
												e instanceof Error
													? e.message
													: t(
															"workspace:detail.failedToDelete",
														),
											);
										} finally {
											setIsLoading(false);
										}
									}}
								>
									{t("workspace:actions.delete")}
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value)}
					className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
				>
					<div className="flex flex-row items-center justify-between gap-4">
						<TabsList>
							<TabsTrigger value="chats">
								<MessagesSquareIcon />
								{t("workspace:detail.tabs.myChats")}
							</TabsTrigger>
							<TabsTrigger value="knowledge">
								<BookOpenIcon />
								{t("workspace:detail.tabs.knowledge")}
							</TabsTrigger>
							<TabsTrigger value="toolbox">
								<HammerIcon />
								{t("workspace:detail.tabs.toolbox")}
							</TabsTrigger>
							<TabsTrigger value="members">
								<UsersRound />
								{t("workspace:detail.tabs.members")}
							</TabsTrigger>
						</TabsList>
						<Button
							variant="default"
							onClick={() => {
								navigate(`/new?workspaceId=${workspaceId}`);
							}}
						>
							<PlusIcon />
							{t("workspace:actions.newChat")}
						</Button>
					</div>
					<div className="flex min-h-0 w-full flex-1 flex-col items-start overflow-hidden rounded-xl border border-border bg-card">
						{tab === "members" ? null : (
							<div className="flex w-full flex-row gap-2 border-border border-b bg-primary-foreground p-4">
								<InputGroup className="bg-background">
									<InputGroupInput
										placeholder={t("common:buttons.search")}
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
									/>
									<InputGroupAddon>
										<SearchIcon />
									</InputGroupAddon>
								</InputGroup>
							</div>
						)}

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
									workspaceId={workspaceId}
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
									workspaceId={workspaceId}
									search={debouncedSearch}
								/>
							)}
						</TabsContent>
						<TabsContent
							value="members"
							className="w-full overflow-hidden rounded-md"
						>
							{tab === "members" && (
								<MembersTable
									id={workspaceId}
									type="WORKSPACE"
								/>
							)}
						</TabsContent>
					</div>
				</Tabs>
			</div>
			<Dialog open={deleteModal} onOpenChange={setDeleteModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("workspace:card.deleteConfirmTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:card.deleteConfirmDescription", {
								name: getWorkspace?.data?.name,
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={(e) => {
								e.stopPropagation();
								setDeleteModal(false);
							}}
							data-testid={`workspace-detail-page--cancel-delete-btn`}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							variant="destructive"
							data-testid={`workspace-detail-page--confirm-delete-btn`}
							onClick={async (e) => {
								e.stopPropagation();

								setIsLoading(true);
								try {
									await chat.deleteWorkspace(workspaceId);

									// go to the workspace
									navigate("/agent");
								} catch (e) {
									toast.error(
										e instanceof Error
											? e.message
											: t(
													"workspace:detail.failedToDelete",
												),
									);
								} finally {
									setIsLoading(false);
								}
							}}
						>
							{t("workspace:actions.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});
