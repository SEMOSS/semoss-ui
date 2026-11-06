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
import { ConversationScrollContext } from "./conversation-scroll.context";
import {
	type RoomLayoutActions,
	RoomLayoutActionsContext,
} from "./room-layout-actions.context";
import { WorkspaceNavigationContext } from "./workspace-navigation.context";

/** Props for {@link RoomLayout}. */
export interface RoomLayoutProps {
	/** The conversation and its composer, mounted for the lifetime of the room. */
	children: ReactNode;
	/** The room's workbench, shown as the Workspace. */
	workbench: ReactNode;
	/** Whether the Workspace is open. */
	isWorkbenchOpen: boolean;
	/**
	 * The room header. It floats over the top of the conversation, so an open
	 * Workspace takes the full height beside it; on narrow screens, where one
	 * pane shows at a time, it sits above both.
	 */
	header?: ReactNode;
	/**
	 * The Workspace's content width in px, which it opens to until the user
	 * drags the divider; null or omitted to take its default share.
	 */
	workbenchFitWidth?: number | null;
}

/** The Workspace's share of the row, in percent, when it fills. */
const WORKBENCH_DEFAULT_SIZE = 65;

/** The most of the row the Workspace takes when fitting its content. */
const WORKBENCH_MAX_FIT_SIZE = 75;

/** The least of the row each pane can be dragged to, in percent. */
const PANE_MIN_SIZE = 25;

/** Below this row width in px, one pane shows at a time, behind tabs. */
const NARROW_WIDTH = 1024;

/** Which pane a narrow row shows. */
type RoomLayoutPane = "conversation" | "workbench";

/**
 * A room's conversation beside its Workspace: one stable pair of panes
 * across desktop and narrow views.
 */
export function RoomLayout({
	children,
	workbench,
	isWorkbenchOpen: isOpen,
	header,
	workbenchFitWidth: fitWidth = null,
}: RoomLayoutProps) {
	const { t } = useTranslation("room");
	const id = useId();
	const setNavigationWorkspaceOpen = useContext(WorkspaceNavigationContext);
	const containerRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const conversationRef = useRef<HTMLDivElement>(null);
	const workbenchRef = useRef<HTMLDivElement>(null);
	const workbenchPaneRef = useRef<ComponentRef<typeof ResizablePanel>>(null);
	const lastConversationFocus = useRef<HTMLElement | null>(null);
	// The header control that brought the Workspace into view, so closing the
	// Workspace from inside it hands focus back there.
	const revealedFrom = useRef<HTMLElement | null>(null);
	const wasOpen = useRef(isOpen);
	const [rowWidth, setRowWidth] = useState(0);
	// once the user drags the divider, the Workspace keeps their size
	const [isUserSized, setIsUserSized] = useState(false);
	const [view, setView] = useState<RoomLayoutPane>(
		isOpen ? "workbench" : "conversation",
	);
	// the Workspace mounts the first time it opens and stays mounted after
	const [hasOpened, setHasOpened] = useState(isOpen);
	const [previousIsOpen, setPreviousIsOpen] = useState(isOpen);
	// the conversation has scrolled beneath the floating header
	const [isConversationScrolled, setIsConversationScrolled] = useState(false);

	// opening the Workspace brings it forward
	if (isOpen !== previousIsOpen) {
		setPreviousIsOpen(isOpen);
		if (isOpen) {
			setHasOpened(true);
			setView("workbench");
		}
	}

	const handleRevealWorkbench = useCallback(
		(trigger?: HTMLElement | null) => {
			// a click does not focus a button in every browser, so the panel
			// says which control it is; a menu item's focus falls back to the
			// conversation
			const active = document.activeElement;
			const from =
				trigger ?? (active instanceof HTMLElement ? active : null);
			if (from && headerRef.current?.contains(from))
				revealedFrom.current = from;
			setView("workbench");
		},
		[],
	);

	useEffect(() => {
		setNavigationWorkspaceOpen?.(isOpen);
		return () => setNavigationWorkspaceOpen?.(false);
	}, [isOpen, setNavigationWorkspaceOpen]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setRowWidth(entry.contentRect.width);
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const isNarrow = rowWidth > 0 && rowWidth < NARROW_WIDTH;
	const activeView = isOpen ? view : "conversation";
	const isConversationShown = !isNarrow || activeView === "conversation";
	const isWorkbenchShown =
		isOpen && (!isNarrow || activeView === "workbench");
	const hasTabs = isNarrow && isOpen;
	// the fitted share of the row; null fills
	const fitSize =
		fitWidth !== null && rowWidth > 0
			? Math.min((fitWidth / rowWidth) * 100, WORKBENCH_MAX_FIT_SIZE)
			: null;
	// a pane narrower than the minimum share is what fitting is for
	const workbenchMinSize = Math.min(PANE_MIN_SIZE, fitSize ?? PANE_MIN_SIZE);

	// the panel group is an external layout engine: size it to the content
	// whenever the content changes, until the user takes over
	useEffect(() => {
		if (!isOpen || isNarrow || isUserSized) return;
		workbenchPaneRef.current?.resize(fitSize ?? WORKBENCH_DEFAULT_SIZE);
	}, [fitSize, isOpen, isNarrow, isUserSized]);

	useEffect(() => {
		const active = document.activeElement;
		const hasClosed = wasOpen.current && !isOpen;
		wasOpen.current = isOpen;
		if (
			hasClosed ||
			(!isWorkbenchShown && workbenchRef.current?.contains(active))
		) {
			// a header control keeps focus when it closes the Workspace
			if (headerRef.current?.contains(active)) return;
			// Mobile actions live in a portal, outside workbenchRef. Wait for its
			// drawer to release focus before restoring the conversation.
			const frame = requestAnimationFrame(() => {
				const trigger = revealedFrom.current;
				revealedFrom.current = null;
				if (!isOpen && trigger?.isConnected) {
					trigger.focus();
					return;
				}
				const previous = lastConversationFocus.current;
				if (previous && conversationRef.current?.contains(previous))
					previous.focus();
				else conversationRef.current?.focus();
			});
			return () => cancelAnimationFrame(frame);
		} else if (
			!isConversationShown &&
			conversationRef.current?.contains(active)
		) {
			workbenchRef.current?.focus();
		}
	}, [isOpen, isConversationShown, isWorkbenchShown]);

	const actions = useMemo<RoomLayoutActions>(
		() => ({
			revealWorkbench: handleRevealWorkbench,
			isWorkbenchVisible: isWorkbenchShown,
		}),
		[handleRevealWorkbench, isWorkbenchShown],
	);

	return (
		<RoomLayoutActionsContext.Provider value={actions}>
			<ConversationScrollContext.Provider
				value={setIsConversationScrolled}
			>
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
						onValueChange={(value) =>
							setView(
								value === "workbench"
									? "workbench"
									: "conversation",
							)
						}
						className="min-h-0 w-full min-w-0 flex-1 gap-0"
					>
						{hasTabs && (
							<div className="shrink-0 border-b bg-sidebar px-4 py-2">
								<TabsList
									className="w-full"
									aria-label={t("studio.views")}
								>
									<TabsTrigger
										value="conversation"
										id={`${id}-conversation-tab`}
										aria-controls={`${id}-conversation-panel`}
									>
										{t("studio.chat")}
									</TabsTrigger>
									<TabsTrigger
										value="workbench"
										id={`${id}-workbench-tab`}
										aria-controls={`${id}-workbench-panel`}
									>
										{t("studio.workspace")}
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
								defaultSize={100 - WORKBENCH_DEFAULT_SIZE}
								minSize={PANE_MIN_SIZE}
								className={cn(
									"relative min-w-0",
									!isConversationShown && "hidden",
								)}
							>
								{header && !hasTabs && (
									<div
										ref={headerRef}
										className={cn(
											"absolute inset-x-0 top-0 z-20 transition-[background-color,backdrop-filter] duration-200",
											isConversationScrolled &&
												"bg-background/75 backdrop-blur-sm",
										)}
									>
										{header}
									</div>
								)}
								<TabsContent
									ref={conversationRef}
									id={`${id}-conversation-panel`}
									onFocusCapture={(event) => {
										// Tabs may focus the region itself when its value changes.
										// Preserve the last control the user was editing.
										if (
											event.target !== event.currentTarget
										) {
											lastConversationFocus.current =
												event.target;
										}
									}}
									forceMount
									value="conversation"
									className="h-full min-h-0"
									role={hasTabs ? "tabpanel" : "region"}
									aria-label={t("studio.chat")}
									aria-labelledby={
										hasTabs
											? `${id}-conversation-tab`
											: undefined
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
								ref={workbenchPaneRef}
								id={`${id}-workbench`}
								order={2}
								defaultSize={WORKBENCH_DEFAULT_SIZE}
								minSize={workbenchMinSize}
								className={cn(
									"min-w-0 bg-muted/30",
									!isWorkbenchShown && "hidden",
								)}
							>
								<TabsContent
									ref={workbenchRef}
									id={`${id}-workbench-panel`}
									forceMount
									value="workbench"
									className="h-full min-h-0"
									role={hasTabs ? "tabpanel" : "region"}
									aria-label={t("studio.workspace")}
									aria-labelledby={
										hasTabs
											? `${id}-workbench-tab`
											: undefined
									}
								>
									{hasOpened && workbench}
								</TabsContent>
							</ResizablePanel>
						</ResizablePanelGroup>
					</Tabs>
				</div>
			</ConversationScrollContext.Provider>
		</RoomLayoutActionsContext.Provider>
	);
}
