import {
	type ComponentRef,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
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
} from "@semoss/ui/next";
import { ChatScrollContext } from "./chat-scroll.context";
import {
	type ConversationWorkspaceActions,
	ConversationWorkspaceActionsContext,
} from "./conversation-workspace-actions.context";
import { WorkspaceNavigationContext } from "./workspace-navigation.context";

interface ConversationWorkspaceProps {
	/** Conversation and its composer, mounted for the lifetime of the room. */
	children: ReactNode;
	/** The room-owned workbench or new-chat configuration. */
	panel: ReactNode;
	/** Whether the contextual work area is visible. */
	isOpen: boolean;
	/**
	 * The route's header, holding the Workspace's places. It floats over the
	 * top of the conversation, so an open work area takes the full height
	 * beside it; on narrow screens, where one pane shows at a time, it sits
	 * above both.
	 */
	header?: ReactNode;
	/**
	 * The work area's content width in px, which it opens to until the user
	 * drags the divider; null or omitted to take its default share.
	 */
	fitWidth?: number | null;
}

/** The work area's share of the row, in percent, when it fills. */
const WORK_AREA_DEFAULT_SIZE = 65;

/** The most of the row the work area takes when fitting its content. */
const WORK_AREA_MAX_FIT_SIZE = 75;

/** The least of the row each pane can be dragged to, in percent. */
const PANE_MIN_SIZE = 25;

/** One stable pair of panes across desktop and narrow views. */
export function ConversationWorkspace({
	children,
	panel,
	isOpen,
	header,
	fitWidth = null,
}: ConversationWorkspaceProps) {
	const { t } = useTranslation("room");
	const id = useId();
	const setWorkAreaOpen = useContext(WorkspaceNavigationContext);
	const containerRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const chatRef = useRef<HTMLDivElement>(null);
	const workRef = useRef<HTMLDivElement>(null);
	const workPanelRef = useRef<ComponentRef<typeof ResizablePanel>>(null);
	const lastChatFocus = useRef<HTMLElement | null>(null);
	// The header control that brought the work area into view, so closing the
	// work area from inside it hands focus back there.
	const revealedFrom = useRef<HTMLElement | null>(null);
	const wasOpen = useRef(isOpen);
	const [isNarrow, setIsNarrow] = useState(false);
	const [rowWidth, setRowWidth] = useState(0);
	// once the user drags the divider, the work area keeps their size
	const [isUserSized, setIsUserSized] = useState(false);
	const [view, setView] = useState("chat");
	const [hasOpened, setHasOpened] = useState(isOpen);
	// the conversation has scrolled beneath the floating header
	const [isChatScrolled, setIsChatScrolled] = useState(false);

	const handleRevealWorkArea = useCallback((trigger?: HTMLElement | null) => {
		// a click does not focus a button in every browser, so the place
		// says which control it is; a menu item's focus falls back to the
		// chat
		const active = document.activeElement;
		const from = trigger ?? (active instanceof HTMLElement ? active : null);
		if (from && headerRef.current?.contains(from))
			revealedFrom.current = from;
		setView("work");
	}, []);

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
			if (!entry) return;
			setIsNarrow(entry.contentRect.width < 1024);
			setRowWidth(entry.contentRect.width);
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const activeView = isOpen ? view : "chat";
	const showChat = !isOpen || !isNarrow || activeView === "chat";
	const showPanel = isOpen && (!isNarrow || activeView === "work");
	const hasTabs = isNarrow && isOpen;
	// the fitted share of the row; null fills
	const fitSize =
		fitWidth !== null && rowWidth > 0
			? Math.min((fitWidth / rowWidth) * 100, WORK_AREA_MAX_FIT_SIZE)
			: null;
	// a pane narrower than the minimum share is what fitting is for
	const workMinSize = Math.min(PANE_MIN_SIZE, fitSize ?? PANE_MIN_SIZE);

	// the panel group is an external layout engine: size it to the content
	// whenever the content changes, until the user takes over
	useEffect(() => {
		if (!isOpen || isNarrow || isUserSized) return;
		workPanelRef.current?.resize(fitSize ?? WORK_AREA_DEFAULT_SIZE);
	}, [fitSize, isOpen, isNarrow, isUserSized]);

	useEffect(() => {
		const active = document.activeElement;
		const hasClosed = wasOpen.current && !isOpen;
		wasOpen.current = isOpen;
		if (hasClosed || (!showPanel && workRef.current?.contains(active))) {
			// a header place keeps focus when it closes the Workspace
			if (headerRef.current?.contains(active)) return;
			// Mobile actions live in a portal, outside workRef. Wait for its
			// drawer to release focus before restoring the conversation.
			const frame = requestAnimationFrame(() => {
				const trigger = revealedFrom.current;
				revealedFrom.current = null;
				if (!isOpen && trigger?.isConnected) {
					trigger.focus();
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
	}, [isOpen, showChat, showPanel]);

	const actions = useMemo<ConversationWorkspaceActions>(
		() => ({
			revealWorkArea: handleRevealWorkArea,
			isWorkAreaVisible: showPanel,
		}),
		[handleRevealWorkArea, showPanel],
	);

	return (
		<ConversationWorkspaceActionsContext.Provider value={actions}>
			<ChatScrollContext.Provider value={setIsChatScrolled}>
				<div
					ref={containerRef}
					className="relative flex h-full min-h-0 min-w-0 flex-col"
				>
					{header && hasTabs && (
						<div ref={headerRef} className="shrink-0">
							{header}
						</div>
					)}
					<Tabs
						value={activeView}
						onValueChange={setView}
						className="min-h-0 w-full min-w-0 flex-1 gap-0"
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
								defaultSize={100 - WORK_AREA_DEFAULT_SIZE}
								minSize={PANE_MIN_SIZE}
								className={cn(
									"relative min-w-0",
									!showChat && "hidden",
								)}
							>
								{header && !hasTabs && (
									<div
										ref={headerRef}
										className={cn(
											"absolute inset-x-0 top-0 z-20 transition-[background-color,backdrop-filter] duration-200",
											isChatScrolled &&
												"bg-background/75 backdrop-blur-sm",
										)}
									>
										{header}
									</div>
								)}
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
								onDragging={(isDragging) => {
									if (isDragging) setIsUserSized(true);
								}}
								// on the Workspace's edge, a 2px line on hover or drag as the
								// navigation's edge shows; a wider invisible strip to grab
								className={cn(
									"before:-translate-x-1/2 z-10 w-px bg-transparent before:absolute before:inset-y-0 before:left-1/2 before:w-2 after:w-0.5 after:bg-transparent after:transition-colors hover:after:bg-sidebar-border focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:after:bg-ring data-[resize-handle-state=drag]:after:bg-sidebar-border",
									(!isOpen || isNarrow) && "hidden",
								)}
							/>
							<ResizablePanel
								ref={workPanelRef}
								id={`${id}-work-area`}
								order={2}
								defaultSize={WORK_AREA_DEFAULT_SIZE}
								minSize={workMinSize}
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
				</div>
			</ChatScrollContext.Provider>
		</ConversationWorkspaceActionsContext.Provider>
	);
}
