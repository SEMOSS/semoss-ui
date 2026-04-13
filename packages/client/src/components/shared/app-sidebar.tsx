import {
	Archive,
	Bolt,
	Bot,
	CircleUserRound,
	Database,
	Home,
	LayoutGrid,
	PanelLeftOpen,
	Settings,
	ShieldCheck,
	Sigma,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import {
	Sidebar as ShadcnSidebar,
	SidebarContent as ShadcnSidebarContent,
	SidebarFooter as ShadcnSidebarFooter,
	SidebarHeader as ShadcnSidebarHeader,
	Sheet,
	SheetContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarSeparator,
} from "@semoss/ui/next";
import { usePage, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { LogoutPopover } from "./LogoutPopover";

const CATALOG_ROUTES = [
	{
		text: "Apps",
		icon: <LayoutGrid className="size-4" />,
		route: "/app",
	},
	{
		text: "Model",
		icon: <Bot className="size-4" />,
		route: "/engine/model",
	},
	{
		text: "Database",
		icon: <Database className="size-4" />,
		route: "/engine/database",
	},
	{
		text: "Vector",
		icon: <Bolt className="size-4" />,
		route: "/engine/vector",
	},
	{
		text: "Function",
		icon: <Sigma className="size-4" />,
		route: "/engine/function",
	},
	{
		text: "Storage",
		icon: <Archive className="size-4" />,
		route: "/engine/storage",
	},
	{
		text: "Guardrail",
		icon: <ShieldCheck className="size-4" />,
		route: "/engine/guardrail",
	},
];

const SIDEBAR_WIDTH = "18rem";
const NAV_BUTTON_CLASS =
	"h-auto rounded-none px-4 py-2 text-sm data-[active=true]:bg-primary/10 data-[active=true]:text-primary";

export const Sidebar: React.FC = observer(() => {
	const { configStore } = useRootStore();
	const { page } = usePage();

	const { pathname } = useLocation();

	const [viewSidebar, setViewSidebar] = useState(false);
	const [isLogoutPopoverOpen, setIsLogoutPopoverOpen] = useState(false);
	useEffect(() => {
		if (configStore.store.user.admin) {
			setViewSidebar(true);
		} else if (
			!configStore.store.user.admin &&
			!configStore.store.config.adminOnlyViewMenuBarFlag
		) {
			setViewSidebar(true);
		}
	}, [
		configStore.store.user.admin,
		configStore.store.config.adminOnlyViewMenuBarFlag,
	]);

	function closeSidebar() {
		if (page.sidebar.pinned || isLogoutPopoverOpen) {
			return;
		}
		page.closeSidebar();
	}

	function toggleSidebarPin() {
		if (page.sidebar.pinned) {
			page.unpinSidebar();
			closeSidebar();
			return;
		}

		page.pinSidebar();
	}

	const sidebarContent = (
		<SidebarProvider
			defaultOpen={true}
			className="h-full min-h-0 w-full"
			style={{ "--sidebar-width": SIDEBAR_WIDTH } as React.CSSProperties}
		>
			<ShadcnSidebar
				collapsible="none"
				className="h-full border-r-0"
				onMouseLeave={() => closeSidebar()}
			>
				<ShadcnSidebarHeader className="gap-0 p-0">
					<div className="relative z-0 flex w-full items-center px-4 pt-3 pb-3">
						<span className="flex-1 font-bold text-lg leading-tight">
							{configStore.theme.name}
						</span>
						<button
							type="button"
							aria-label={
								page.sidebar.pinned
									? "Unpin Sidebar"
									: "Pin Sidebar"
							}
							className="shrink-0 rounded-[7.5px] border border-border p-[3.75px] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
							onClick={toggleSidebarPin}
						>
							<PanelLeftOpen className="size-5" />
						</button>
					</div>
				</ShadcnSidebarHeader>

				<SidebarSeparator className="mx-0" />

				<ShadcnSidebarContent className="gap-0">
					<SidebarGroup className="p-0">
						<SidebarMenu
							className="gap-0"
							aria-label="main navigation"
						>
							<SidebarMenuItem className="py-0.5">
								<SidebarMenuButton
									asChild
									isActive={!!matchPath("/", pathname)}
									className={NAV_BUTTON_CLASS}
									data-testid={formatToDataTestId(
										"sidebar-home-btn",
									)}
								>
									<Link
										to={"/"}
										aria-label={"Home"}
										className="text-inherit no-underline"
									>
										<span className="flex w-7 min-w-0 shrink-0 items-center">
											<Home className="size-4" />
										</span>
										<span className="flex-1 truncate text-left">
											Home
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>

					<SidebarSeparator className="mx-0" />

					{/* Catalog navigation */}
					{viewSidebar ? (
						<SidebarGroup className="p-0">
							<SidebarGroupLabel className="h-auto rounded-none px-4 py-2 font-semibold text-muted-foreground text-xs">
								Catalog
							</SidebarGroupLabel>
							<SidebarMenu
								className="gap-0"
								aria-label="catalog navigation"
							>
								{CATALOG_ROUTES.map((r) => (
									<SidebarMenuItem
										key={r.route}
										className="py-0.5"
									>
										<SidebarMenuButton
											asChild
											isActive={
												!!matchPath(
													`${r.route}/*`,
													pathname,
												)
											}
											className={NAV_BUTTON_CLASS}
											data-testid={formatToDataTestId(
												`sidebar-${r.text}-btn`,
											)}
										>
											<Link
												to={r.route}
												aria-label={r.text}
												className="text-inherit no-underline"
											>
												<span className="flex w-7 min-w-0 shrink-0 items-center">
													{r.icon}
												</span>
												<span className="flex-1 truncate text-left">
													{r.text}
												</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroup>
					) : null}

					<SidebarSeparator className="mx-0" />

					{/* Settings */}
					<SidebarGroup className="flex-1 p-0">
						<SidebarMenu className="gap-0">
							<SidebarMenuItem className="py-0.5">
								<SidebarMenuButton
									asChild
									isActive={
										!!matchPath("/settings/*", pathname)
									}
									className={NAV_BUTTON_CLASS}
									data-testid={formatToDataTestId(
										"sidebar-settings-btn",
									)}
								>
									<Link
										to={"/settings"}
										aria-label={"Settings"}
										className="text-inherit no-underline"
									>
										<span className="flex w-7 min-w-0 shrink-0 items-center">
											<Settings className="size-4" />
										</span>
										<span className="flex-1 truncate text-left">
											Settings
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				</ShadcnSidebarContent>

				<SidebarSeparator className="mx-0" />

				{/* Footer: User / Logout */}
				<ShadcnSidebarFooter className="p-0">
					<SidebarMenu className="gap-0" aria-label="user navigation">
						<SidebarMenuItem>
							<LogoutPopover
								onOpenChange={setIsLogoutPopoverOpen}
							>
								<SidebarMenuButton
									aria-label="Login"
									className={NAV_BUTTON_CLASS}
									data-testid={formatToDataTestId(
										"sidebar-login-btn",
									)}
								>
									<span className="flex w-7 min-w-0 shrink-0 items-center">
										<CircleUserRound className="size-6" />
									</span>
									<span className="max-w-full flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
										{configStore.store.user.name || ""}
									</span>
								</SidebarMenuButton>
							</LogoutPopover>
						</SidebarMenuItem>
					</SidebarMenu>
				</ShadcnSidebarFooter>
			</ShadcnSidebar>
		</SidebarProvider>
	);

	// Permanent sidebar (pinned): participates in flex layout
	if (page.sidebar.pinned) {
		return (
			<aside className="relative z-10 flex h-full w-72 shrink-0 flex-col border-border border-r bg-sidebar">
				{sidebarContent}
			</aside>
		);
	}

	// Temporary sidebar (not pinned): renders as an overlay Sheet
	return (
		<Sheet
			open={page.sidebar.open}
			onOpenChange={(open) => {
				if (!open && !isLogoutPopoverOpen) {
					closeSidebar();
				}
			}}
		>
			<SheetContent
				side="left"
				className="w-72 max-w-none gap-0 bg-sidebar p-0 [&>button]:hidden"
			>
				{sidebarContent}
			</SheetContent>
		</Sheet>
	);
});
