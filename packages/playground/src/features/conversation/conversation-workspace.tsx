import {
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import { ConversationWorkspaceActionsContext } from "./conversation-workspace-actions.context";
import { ConversationWorkspaceRailContext } from "./conversation-workspace-rail.context";
import { OpenWorkspaceButton } from "./open-workspace-button";
import { WorkspaceNavigationContext } from "./workspace-navigation.context";

interface ConversationWorkspaceProps {
	/** Conversation and its composer, mounted for the lifetime of the room. */
	children: ReactNode;
	/** The room-owned workbench or new-chat configuration. */
	panel: ReactNode;
	/** Whether the contextual work area is visible. */
	isOpen: boolean;
	/** Opens the contextual work area, restoring its prior contents when possible. */
	onOpenWorkArea: () => void;
	/** The Workspace's places, beside the work area on wide screens. */
	rail?: ReactNode;
	/** The same places as menu items, behind the open button on narrow screens. */
	railMenuItems?: ReactNode;
}

/** One stable pair of panes across desktop and narrow views. */
export function ConversationWorkspace({
	children,
	panel,
	isOpen,
	onOpenWorkArea,
	rail,
	railMenuItems,
}: ConversationWorkspaceProps) {
	const { t } = useTranslation("room");
	const isMobile = useIsMobile();
	const id = useId();
	const setWorkAreaOpen = useContext(WorkspaceNavigationContext);
	const containerRef = useRef<HTMLDivElement>(null);
	const chatRef = useRef<HTMLDivElement>(null);
	const workRef = useRef<HTMLDivElement>(null);
	const railRef = useRef<HTMLDivElement>(null);
	const openWorkAreaRef = useRef<HTMLButtonElement>(null);
	const lastChatFocus = useRef<HTMLElement | null>(null);
	const openedFromTrigger = useRef(false);
	const pendingWorkAreaFocus = useRef(false);
	const wasOpen = useRef(isOpen);
	const [isNarrow, setIsNarrow] = useState(false);
	const [focusRequest, setFocusRequest] = useState(0);
	const [view, setView] = useState("chat");
	const [hasOpened, setHasOpened] = useState(isOpen);

	const handleOpenWorkArea = useCallback(() => {
		openedFromTrigger.current = true;
		pendingWorkAreaFocus.current = true;
		setView("work");
		setFocusRequest((request) => request + 1);
		onOpenWorkArea();
	}, [onOpenWorkArea]);

	// Choosing a place in the menu opens the Workspace the way the button does,
	// so focus moves into it and returns to the button when it closes.
	const handleRailMenuOpenChange = (isMenuOpen: boolean) => {
		if (!isMenuOpen) return;
		openedFromTrigger.current = true;
		setFocusRequest((request) => request + 1);
	};

	useEffect(() => {
		setWorkAreaOpen?.(isOpen);
		return () => setWorkAreaOpen?.(false);
	}, [isOpen, setWorkAreaOpen]);

	useEffect(() => {
		if (isOpen) {
			setHasOpened(true);
			setView("work");
		}
	}, [isOpen]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setIsNarrow(entry.contentRect.width < 1024);
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const activeView = isOpen ? view : "chat";
	const showChat = !isOpen || !isNarrow || activeView === "chat";
	const showPanel = isOpen && (!isNarrow || activeView === "work");
	const hasTabs = isNarrow && isOpen;
	const showRail = Boolean(rail) && !isNarrow && !isMobile;

	useEffect(() => {
		const active = document.activeElement;
		const hasOpenedFromClosed = !wasOpen.current && isOpen;
		const hasClosed = wasOpen.current && !isOpen;
		wasOpen.current = isOpen;
		if (hasOpenedFromClosed && openedFromTrigger.current) {
			pendingWorkAreaFocus.current = true;
		}
		if (focusRequest > 0 && pendingWorkAreaFocus.current && showPanel) {
			pendingWorkAreaFocus.current = false;
			const frame = requestAnimationFrame(() => workRef.current?.focus());
			return () => cancelAnimationFrame(frame);
		}
		if (hasClosed || (!showPanel && workRef.current?.contains(active))) {
			pendingWorkAreaFocus.current = false;
			// a place on the rail keeps focus when it closes the Workspace
			if (railRef.current?.contains(active)) return;
			// Mobile actions live in a portal, outside workRef. Wait for its
			// drawer to release focus before restoring the conversation.
			const frame = requestAnimationFrame(() => {
				if (hasClosed && openedFromTrigger.current) {
					openedFromTrigger.current = false;
					openWorkAreaRef.current?.focus();
					return;
				}
				const previous = lastChatFocus.current;
				if (previous && chatRef.current?.contains(previous))
					previous.focus();
				else chatRef.current?.focus();
			});
			return () => cancelAnimationFrame(frame);
		} else if (!showChat && chatRef.current?.contains(active)) {
			workRef.current?.focus();
		}
	}, [isOpen, showChat, showPanel, focusRequest]);

	return (
		<ConversationWorkspaceActionsContext.Provider
			value={handleOpenWorkArea}
		>
			<ConversationWorkspaceRailContext.Provider value={showRail}>
				<div
					ref={containerRef}
					className="relative flex h-full min-h-0 min-w-0"
				>
					{!isOpen && !showRail && (
						<OpenWorkspaceButton
							ref={openWorkAreaRef}
							menuItems={railMenuItems}
							onOpen={handleOpenWorkArea}
							onMenuOpenChange={handleRailMenuOpenChange}
							controlsId={`${id}-work-panel`}
						/>
					)}
					<Tabs
						value={activeView}
						onValueChange={setView}
						className="h-full min-w-0 flex-1 gap-0"
					>
						{hasTabs && (
							<div className="shrink-0 border-b bg-sidebar px-4 py-2">
								<TabsList
									className="w-full"
									aria-label={t("studio.views")}
								>
									<TabsTrigger
										value="chat"
										id={`${id}-chat-tab`}
										aria-controls={`${id}-chat-panel`}
									>
										{t("studio.chat")}
									</TabsTrigger>
									<TabsTrigger
										value="work"
										id={`${id}-work-tab`}
										aria-controls={`${id}-work-panel`}
									>
										{t("studio.workArea")}
									</TabsTrigger>
								</TabsList>
							</div>
						)}
						<ResizablePanelGroup
							direction="horizontal"
							className="min-h-0 flex-1"
						>
							<ResizablePanel
								id={`${id}-conversation`}
								order={1}
								defaultSize={35}
								minSize={25}
								className={cn("min-w-0", !showChat && "hidden")}
							>
								<TabsContent
									ref={chatRef}
									id={`${id}-chat-panel`}
									onFocusCapture={(event) => {
										// Tabs may focus the region itself when its value changes.
										// Preserve the last control the user was editing.
										if (
											event.target !== event.currentTarget
										) {
											lastChatFocus.current =
												event.target;
										}
									}}
									forceMount
									value="chat"
									className="h-full min-h-0"
									role={hasTabs ? "tabpanel" : "region"}
									aria-label={t("studio.chat")}
									aria-labelledby={
										hasTabs ? `${id}-chat-tab` : ""
									}
								>
									{children}
								</TabsContent>
							</ResizablePanel>
							<ResizableHandle
								withHandle
								className={cn(
									(!isOpen || isNarrow) && "hidden",
								)}
							/>
							<ResizablePanel
								id={`${id}-work-area`}
								order={2}
								defaultSize={65}
								minSize={25}
								className={cn(
									"min-w-0 bg-muted/30",
									!showPanel && "hidden",
								)}
							>
								<TabsContent
									ref={workRef}
									id={`${id}-work-panel`}
									forceMount
									value="work"
									className="h-full min-h-0"
									role={hasTabs ? "tabpanel" : "region"}
									aria-label={t("studio.workArea")}
									aria-labelledby={
										hasTabs ? `${id}-work-tab` : ""
									}
								>
									{(hasOpened || isOpen) && panel}
								</TabsContent>
							</ResizablePanel>
						</ResizablePanelGroup>
					</Tabs>
					{showRail && (
						<div ref={railRef} className="flex h-full shrink-0">
							{rail}
						</div>
					)}
				</div>
			</ConversationWorkspaceRailContext.Provider>
		</ConversationWorkspaceActionsContext.Provider>
	);
}
