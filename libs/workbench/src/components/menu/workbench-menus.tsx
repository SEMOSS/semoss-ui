import { ChevronDown } from "lucide-react";
import { type ReactNode, useRef } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { getWorkbenchMenuLabel } from "../../constants/workbench-menu.constants";
import { useWorkbench } from "../../hooks/use-workbench";
import { useWorkbenchCommands } from "../../hooks/use-workbench-commands";
import type { WorkbenchMenuTranslate } from "../../types";
import { WORKBENCH_SIDES } from "../../types";

interface WorkbenchMenusProps {
	/** Optional smaller menu typography; control hit targets retain their size. */
	textSize?: "sm" | "xs";
	/** Show a decorative dropdown indicator beside the trigger label. */
	showChevron?: boolean;
	/** Host-owned items rendered as the first section in View. */
	viewItems?: ReactNode;
	/** Hosts can replace the navigation submenu with their own destinations. */
	showNavigation?: boolean;
	/** Hide the layout submenu and side-area toggles without changing dock behavior. */
	showLayoutActions?: boolean;
	/** Hosts can expose the command palette from a separate control. */
	showCommandPalette?: boolean;
	/** Optional host translation; the default is English. */
	translate?: WorkbenchMenuTranslate;
	/** Dismiss a containing mobile drawer after choosing a panel. */
	onNavigate?: () => void;
	/** Optional host-owned expansion of the entire work area, not one tab group. */
	maximize?: { isMaximized: boolean; onToggle: () => void };
}

/** Generic View menu with Layout and Navigate submenus for a host's top border slot. */
export function WorkbenchMenus({
	translate: t = getWorkbenchMenuLabel,
	onNavigate,
	maximize,
	viewItems,
	showNavigation = true,
	showLayoutActions = true,
	showCommandPalette = true,
	textSize = "sm",
	showChevron = false,
}: WorkbenchMenusProps) {
	const actions = useWorkbench((s) => s.layout.actions);
	const setCommandOpen = useWorkbench(
		(s) => s.command.actions.setCommandOpen,
	);
	const panels = useWorkbench((s) => s.layout.panels);
	const ids = useWorkbench((s) => s.layout.openPanelIds);
	const borders = useWorkbench((s) => s.layout.borders);
	const isMobile = useWorkbench((s) => s.layout.isMobileLayout);
	const selected = useWorkbench((s) =>
		s.layout.isMobileLayout
			? s.layout.mobileActivePanelId
			: s.layout.selection.panel,
	);
	const canSingle = useWorkbench((s) =>
		s.layout.actions.canArrangePanels("single"),
	);
	const canSplit = useWorkbench((s) =>
		s.layout.actions.canArrangePanels("columns"),
	);
	const canBalance = useWorkbench(
		(s) =>
			!s.layout.isMobileLayout &&
			(s.layout.tabsets.length > 1 ||
				s.layout.tabsets.some((tabset) => Boolean(tabset.split))),
	);
	const isLoading = useWorkbench((s) => s.loading.isLoading);
	const afterMenuClose = useRef<(() => void) | null>(null);
	const occupiedSides = WORKBENCH_SIDES.filter(
		(side) => borders[side].panelIds.length > 0,
	);
	const hasPrimaryActions = showCommandPalette || Boolean(maximize);
	const hasNavigationSection =
		(!isMobile && showLayoutActions) || showNavigation;
	const menuTextClass =
		textSize === "xs"
			? "[&_[data-slot=dropdown-menu-label]]:text-xs [&_[role^=menuitem]]:text-xs"
			: undefined;
	const triggerClass = cn(
		"data-[state=open]:bg-accent",
		textSize === "xs" && "text-xs",
		isMobile && "min-h-11 min-w-11",
	);

	useWorkbenchCommands([
		{
			id: "workbench.menus.single",
			category: t("view"),
			label: t("single"),
			visible: canSingle && !isLoading,
			handler: () => actions.arrangePanels("single"),
		},
		{
			id: "workbench.menus.columns",
			category: t("view"),
			label: t("columns"),
			visible: canSplit && !isLoading,
			handler: () => actions.arrangePanels("columns"),
		},
		{
			id: "workbench.menus.rows",
			category: t("view"),
			label: t("rows"),
			visible: canSplit && !isLoading,
			handler: () => actions.arrangePanels("rows"),
		},
		{
			id: "workbench.menus.balance",
			category: t("view"),
			label: t("balance"),
			visible: canBalance && !isLoading,
			handler: () => actions.balanceLayout(),
		},
		{
			id: "workbench.menus.previous",
			category: "Go to",
			label: t("previous"),
			visible: ids.length > 1,
			handler: () => {
				actions.navigateRelativePanel(-1);
				onNavigate?.();
			},
		},
		{
			id: "workbench.menus.next",
			category: "Go to",
			label: t("next"),
			visible: ids.length > 1,
			handler: () => {
				actions.navigateRelativePanel(1);
				onNavigate?.();
			},
		},
	]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className={triggerClass}
				>
					{t("view")}
					{showChevron && (
						<ChevronDown aria-hidden="true" className="size-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={isMobile ? "end" : "start"}
				collisionPadding={8}
				className={cn(
					"w-64 max-w-full",
					menuTextClass,
					isMobile && "w-48 [&_[role=menuitem]]:min-h-11",
				)}
				onCloseAutoFocus={(event) => {
					const action = afterMenuClose.current;
					if (action) {
						event.preventDefault();
						afterMenuClose.current = null;
						action();
					}
				}}
			>
				{viewItems && (
					<>
						{viewItems}
						{(hasPrimaryActions || hasNavigationSection) && (
							<DropdownMenuSeparator />
						)}
					</>
				)}
				{showCommandPalette && (
					<DropdownMenuItem
						onSelect={() => {
							afterMenuClose.current = () => setCommandOpen(true);
						}}
					>
						{t("commandPalette")}
					</DropdownMenuItem>
				)}
				{maximize && (
					<DropdownMenuItem onSelect={maximize.onToggle}>
						{t(maximize.isMaximized ? "restore" : "maximize")}
					</DropdownMenuItem>
				)}
				{hasPrimaryActions && hasNavigationSection && (
					<DropdownMenuSeparator />
				)}
				{!isMobile && showLayoutActions && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							{t("layout")}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent
							collisionPadding={8}
							className={cn(
								"max-h-(--radix-dropdown-menu-content-available-height) w-64 min-w-0 max-w-(--radix-dropdown-menu-content-available-width) overflow-y-auto",
								menuTextClass,
								isMobile &&
									"[&_[role=menuitem]]:min-h-11 [&_[role=menuitemradio]]:min-h-11",
							)}
						>
							<DropdownMenuItem
								disabled={!canSingle || isLoading}
								onSelect={() => actions.arrangePanels("single")}
							>
								{t("single")}
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={!canSplit || isLoading}
								onSelect={() =>
									actions.arrangePanels("columns")
								}
							>
								{t("columns")}
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={!canSplit || isLoading}
								onSelect={() => actions.arrangePanels("rows")}
							>
								{t("rows")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								disabled={!canBalance || isLoading}
								onSelect={actions.balanceLayout}
							>
								{t("balance")}
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}
				{showNavigation && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							{t("navigate")}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent
							collisionPadding={8}
							className={cn(
								"max-h-(--radix-dropdown-menu-content-available-height) w-64 min-w-0 max-w-(--radix-dropdown-menu-content-available-width) overflow-y-auto",
								menuTextClass,
								isMobile &&
									"[&_[role=menuitem]]:min-h-11 [&_[role=menuitemradio]]:min-h-11",
							)}
						>
							<DropdownMenuItem
								disabled={ids.length < 2}
								onSelect={() => {
									actions.navigateRelativePanel(-1);
									onNavigate?.();
								}}
							>
								{t("previous")}
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={ids.length < 2}
								onSelect={() => {
									actions.navigateRelativePanel(1);
									onNavigate?.();
								}}
							>
								{t("next")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>
								{t("openPanels")}
							</DropdownMenuLabel>
							{ids.length === 0 ? (
								<DropdownMenuItem disabled>
									{t("noPanels")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuRadioGroup value={selected ?? ""}>
									{ids.map((pid) => (
										<DropdownMenuRadioItem
											key={pid}
											value={pid}
											onSelect={() => {
												actions.navigatePanel(pid);
												onNavigate?.();
											}}
											className="whitespace-normal break-all"
										>
											{panels[pid]?.name ?? pid}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}
				{!isMobile && showLayoutActions && (
					<>
						{occupiedSides.length > 0 && <DropdownMenuSeparator />}
						{occupiedSides.map((side) => (
							<DropdownMenuCheckboxItem
								key={side}
								checked={Boolean(borders[side].activeId)}
								onCheckedChange={(checked) => {
									const first = borders[side].panelIds[0];
									if (checked && first)
										actions.toggleBorderPanel(side, first);
									else actions.collapseBorder(side);
								}}
							>
								{t(side)}
							</DropdownMenuCheckboxItem>
						))}
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
