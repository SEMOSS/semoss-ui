import {
	ChevronDownIcon,
	FileIcon,
	HammerIcon,
	MonitorXIcon,
	Settings2Icon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { getFileIconComponent } from "@semoss/shared";
import { cn } from "@semoss/ui";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ChatOptions } from "../chat-options";
import { ChatProvider, useChatContext } from "../contexts/chat-provider";
import type { ChatMessage } from "../types";
import { ChatInput } from "./chat-input";
import { FileEditorSidebar } from "./file-editor-sidebar";
import type { McpOverlayAgent, McpOverlayWorkspaceRef } from "./mcp-overlay";
import type { ToolResponseDetails } from "./message-bubble";
import { MessageList, type MessageRenderHelpers } from "./message-list";
import { RoomSettingsSidebar } from "./room-settings-sidebar";
import { ToolResponseSidebar } from "./tool-response-sidebar";

type SidebarTab =
	| { id: string; title: string; type: "tool"; tool: ToolResponseDetails }
	| {
			id: string;
			title: string;
			type: "file";
			fileName: string;
			path: string;
	  }
	| { id: string; title: string; type: "settings" };

function getSidebarTabIcon(tab: SidebarTab) {
	if (tab.type === "tool") {
		return HammerIcon;
	}
	if (tab.type === "settings") {
		return Settings2Icon;
	}
	return getFileIconComponent(tab.fileName ?? tab.title) ?? FileIcon;
}

function upsertSidebarTab(tabs: SidebarTab[], next: SidebarTab): SidebarTab[] {
	const existingIndex = tabs.findIndex((tab) => tab.id === next.id);
	if (existingIndex === -1) {
		return [...tabs, next];
	}
	return tabs.map((tab, index) => (index === existingIndex ? next : tab));
}

export interface ChatPanelProps {
	/** Passed straight through to ChatProvider — this component owns the chat session. */
	options: ChatOptions;
	/** Passed to ChatProvider to control global imperative targeting. */
	isActive?: boolean;
	className?: string;
	placeholder?: string;
	emptyState?: ReactNode;
	/** Fixed agents users may attach to the conversation. */
	agents?: readonly McpOverlayAgent[];
	renderMessage?: (
		message: ChatMessage,
		helpers: MessageRenderHelpers,
	) => ReactNode;
	/** Override the waiting-for-first-chunk indicator — same escape hatch as
	 * `renderMessage`, passed straight through to MessageList. */
	renderTypingIndicator?: () => ReactNode;
}

/**
 * Batteries-included: wraps a ChatProvider and wires useChatContext()
 * straight into MessageList + ChatInput for apps that don't want to
 * think about composition at all. For anything more custom (a header
 * showing room info, a different layout), compose MessageList/ChatInput
 * yourself inside your own ChatProvider instead — that escape hatch is
 * the point of keeping them as separate exports.
 */
export function ChatPanel({
	options,
	isActive,
	className,
	placeholder,
	emptyState,
	agents,
	renderMessage,
	renderTypingIndicator,
}: ChatPanelProps) {
	return (
		<ChatProvider options={options} isActive={isActive}>
			<ChatPanelInner
				className={className}
				placeholder={placeholder}
				emptyState={emptyState}
				agents={agents}
				renderMessage={renderMessage}
				renderTypingIndicator={renderTypingIndicator}
			/>
		</ChatProvider>
	);
}

function ChatPanelInner({
	className,
	placeholder,
	emptyState,
	agents,
	renderMessage,
	renderTypingIndicator,
}: Omit<ChatPanelProps, "options">) {
	const {
		isTyping,
		mcp,
		roomId,
		sendMessage,
		setMcp,
		setWorkspaceId,
		workspaceId,
	} = useChatContext();
	const selectedAgent = agents?.find(
		(agent) => agent.workspace_id === workspaceId,
	);
	const workspace: McpOverlayWorkspaceRef | null = workspaceId
		? { workspace_id: workspaceId, name: selectedAgent?.name }
		: null;
	const handleWorkspaceChange = (
		nextWorkspace: McpOverlayWorkspaceRef | null,
	) => {
		void setWorkspaceId(nextWorkspace?.workspace_id ?? null);
	};
	const sidebarTabsRef = useRef<HTMLDivElement | null>(null);
	const [sidebarTabs, setSidebarTabs] = useState<SidebarTab[]>([]);
	const [activeSidebarTabId, setActiveSidebarTabId] = useState<string | null>(
		null,
	);
	const [isSidebarMaximized, setIsSidebarMaximized] = useState(false);
	const [hiddenSidebarTabIds, setHiddenSidebarTabIds] = useState<string[]>(
		[],
	);

	const activeSidebar = useMemo(
		() =>
			activeSidebarTabId
				? (sidebarTabs.find((tab) => tab.id === activeSidebarTabId) ??
					null)
				: null,
		[activeSidebarTabId, sidebarTabs],
	);

	function openSidebarTab(tab: SidebarTab) {
		setSidebarTabs((currentTabs) => upsertSidebarTab(currentTabs, tab));
		setActiveSidebarTabId(tab.id);
	}

	function closeSidebarTab(tabId: string) {
		setSidebarTabs((currentTabs) => {
			const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);
			setActiveSidebarTabId((currentActiveId) => {
				if (currentActiveId !== tabId) {
					return currentActiveId;
				}
				const closingIndex = currentTabs.findIndex(
					(tab) => tab.id === tabId,
				);
				const fallback =
					nextTabs[Math.max(0, closingIndex - 1)] ??
					nextTabs[0] ??
					null;
				return fallback?.id ?? null;
			});
			if (nextTabs.length === 0) {
				setIsSidebarMaximized(false);
			}
			return nextTabs;
		});
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-measure hidden tabs whenever the tab set or maximize state changes, even though the effect body reads the tab strip through a ref.
	useEffect(() => {
		const container = sidebarTabsRef.current;
		if (!container) {
			return;
		}

		const updateHiddenTabs = () => {
			const containerRect = container.getBoundingClientRect();
			const nextHiddenIds = Array.from(container.children).flatMap(
				(child) => {
					if (!(child instanceof HTMLElement)) {
						return [];
					}
					const tabId = child.dataset.sidebarTabId;
					if (!tabId) {
						return [];
					}
					const childRect = child.getBoundingClientRect();
					const isHidden =
						childRect.left < containerRect.left ||
						childRect.right > containerRect.right;
					return isHidden ? [tabId] : [];
				},
			);
			setHiddenSidebarTabIds((currentIds) => {
				if (
					currentIds.length === nextHiddenIds.length &&
					currentIds.every((id, index) => id === nextHiddenIds[index])
				) {
					return currentIds;
				}
				return nextHiddenIds;
			});
		};

		updateHiddenTabs();
		container.addEventListener("scroll", updateHiddenTabs, {
			passive: true,
		});

		if (typeof ResizeObserver !== "undefined") {
			const resizeObserver = new ResizeObserver(() => {
				updateHiddenTabs();
			});
			resizeObserver.observe(container);
			for (const child of Array.from(container.children)) {
				resizeObserver.observe(child);
			}
			return () => {
				container.removeEventListener("scroll", updateHiddenTabs);
				resizeObserver.disconnect();
			};
		}

		window.addEventListener("resize", updateHiddenTabs);
		return () => {
			container.removeEventListener("scroll", updateHiddenTabs);
			window.removeEventListener("resize", updateHiddenTabs);
		};
	}, [sidebarTabs, isSidebarMaximized]);

	useEffect(() => {
		if (!activeSidebarTabId) {
			return;
		}
		const container = sidebarTabsRef.current;
		if (!container) {
			return;
		}
		const activeTab = container.querySelector<HTMLElement>(
			`[data-sidebar-tab-id="${CSS.escape(activeSidebarTabId)}"]`,
		);
		activeTab?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}, [activeSidebarTabId]);

	const sidebarContent = activeSidebar ? (
		activeSidebar.type === "tool" ? (
			<ToolResponseSidebar
				tool={activeSidebar.tool}
				showCloseButton={false}
			/>
		) : activeSidebar.type === "file" ? (
			<FileEditorSidebar
				fileName={activeSidebar.fileName}
				path={activeSidebar.path}
				showCloseButton={false}
			/>
		) : (
			<RoomSettingsSidebar
				mcp={mcp}
				agents={agents}
				workspace={workspace}
				onWorkspaceChange={handleWorkspaceChange}
				onMcpChange={(nextMcp) => {
					void setMcp(nextMcp);
				}}
				showCloseButton={false}
			/>
		)
	) : null;

	const hiddenSidebarTabs = useMemo(
		() =>
			hiddenSidebarTabIds
				.map(
					(tabId) =>
						sidebarTabs.find((tab) => tab.id === tabId) ?? null,
				)
				.filter((tab): tab is SidebarTab => tab !== null),
		[hiddenSidebarTabIds, sidebarTabs],
	);

	return (
		<div
			data-slot="chat-panel"
			className={cn(
				"flex h-full max-h-full min-h-0 flex-col overflow-hidden",
				className,
			)}
		>
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full min-h-0 w-full flex-1 overflow-hidden"
			>
				<ResizablePanel className="flex h-full min-h-0 min-w-0 flex-col">
					<div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
						<div className="min-h-0 flex-1 overflow-hidden">
							<MessageList
								roomId={roomId}
								className="h-full min-h-0"
								renderMessage={renderMessage}
								renderTypingIndicator={renderTypingIndicator}
								emptyState={emptyState}
								onOpenToolResponse={(tool) => {
									openSidebarTab({
										id: `tool:${tool.messageId ?? "message"}:${tool.id}`,
										title:
											tool.title ||
											tool.name ||
											"Tool Response",
										type: "tool",
										tool,
									});
								}}
								onOpenFile={(file) => {
									openSidebarTab({
										id: `file:${file.path}`,
										title: file.fileName,
										type: "file",
										...file,
									});
								}}
							/>
						</div>
						<div className="shrink-0 border-border border-t bg-background p-2">
							<ChatInput
								onSubmit={sendMessage}
								disabled={isTyping}
								placeholder={placeholder}
								mcp={mcp}
								agents={agents}
								workspace={workspace}
								onWorkspaceChange={handleWorkspaceChange}
								onMcpChange={(nextMcp) => {
									void setMcp(nextMcp);
								}}
								defaultSlashCommandActions={{
									onOpenSettings: () => {
										openSidebarTab({
											id: "settings",
											title: "Room Settings",
											type: "settings",
										});
									},
								}}
							/>
						</div>
					</div>
				</ResizablePanel>
				{activeSidebar && (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							defaultSize={40}
							minSize={20}
							className="min-w-0 p-2"
						>
							<div className="relative h-full w-full overflow-hidden">
								<div
									className={cn(
										"fixed inset-0 z-50 bg-black/50 transition-opacity duration-200",
										isSidebarMaximized
											? "pointer-events-auto opacity-100"
											: "pointer-events-none hidden opacity-0",
									)}
								/>
								<div
									className={cn(
										"flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all duration-200 ease-in-out",
										isSidebarMaximized &&
											"fixed inset-4 z-50 h-auto w-auto",
									)}
								>
									<div className="flex h-12.5 min-h-0 items-center gap-2 border-border border-b px-2">
										<div
											ref={sidebarTabsRef}
											className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
										>
											{sidebarTabs.map((tab) => {
												const Icon =
													getSidebarTabIcon(tab);
												const isActive =
													tab.id ===
													activeSidebarTabId;
												return (
													<button
														key={tab.id}
														data-sidebar-tab-id={
															tab.id
														}
														type="button"
														onClick={() =>
															setActiveSidebarTabId(
																tab.id,
															)
														}
														className={cn(
															"inline-flex h-8 shrink-0 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors",
															isActive
																? "border-border bg-muted text-foreground"
																: "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
														)}
													>
														<Icon className="size-4 shrink-0" />
														<span className="max-w-44 truncate">
															{tab.title}
														</span>
													</button>
												);
											})}
										</div>
										<div className="flex shrink-0 items-center gap-1">
											{hiddenSidebarTabs.length > 0 ? (
												<DropdownMenu modal={false}>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="gap-1.5 px-2"
															aria-label={`Show ${hiddenSidebarTabs.length} hidden sidebar tabs`}
														>
															<ChevronDownIcon className="size-4" />
															<span className="font-medium text-xs">
																{
																	hiddenSidebarTabs.length
																}
															</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="w-56"
													>
														{hiddenSidebarTabs.map(
															(tab) => {
																const Icon =
																	getSidebarTabIcon(
																		tab,
																	);
																const isActive =
																	tab.id ===
																	activeSidebarTabId;
																return (
																	<DropdownMenuItem
																		key={
																			tab.id
																		}
																		onClick={() =>
																			setActiveSidebarTabId(
																				tab.id,
																			)
																		}
																	>
																		<Icon className="me-2 size-4" />
																		<span className="min-w-0 flex-1 truncate">
																			{
																				tab.title
																			}
																		</span>
																		{isActive ? (
																			<span className="text-xs">
																				Current
																			</span>
																		) : null}
																	</DropdownMenuItem>
																);
															},
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											) : null}
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setIsSidebarMaximized(
																(current) =>
																	!current,
															);
														}}
													>
														{isSidebarMaximized ? (
															<MonitorXIcon className="size-4" />
														) : (
															<TvMinimalIcon className="size-4" />
														)}
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{isSidebarMaximized
														? "Minimize"
														: "Maximize"}
												</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															if (
																activeSidebarTabId
															) {
																closeSidebarTab(
																	activeSidebarTabId,
																);
															}
														}}
													>
														<XIcon className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Close
												</TooltipContent>
											</Tooltip>
										</div>
									</div>
									<div className="min-h-0 flex-1 overflow-hidden p-2">
										{sidebarContent}
									</div>
								</div>
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
}
