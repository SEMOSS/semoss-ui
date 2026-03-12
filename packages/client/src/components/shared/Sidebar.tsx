/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import {
	Archive,
	Bolt,
	BrainCircuit,
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
import { Button, cn, Separator, Sheet, SheetContent } from "@semoss/ui/next";
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
		icon: <BrainCircuit className="size-4" />,
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

interface NavButtonProps {
	icon: React.ReactNode;
	label: React.ReactNode;
	selected?: boolean;
	testId?: string;
	ariaLabel?: string;
}

function NavButton({
	icon,
	label,
	selected = false,
	testId,
	ariaLabel,
}: NavButtonProps) {
	return (
		<div
			data-testid={testId}
			aria-label={ariaLabel}
			className={cn(
				"flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
				selected && "bg-primary/10 text-primary",
			)}
		>
			<span className="flex w-7 min-w-0 shrink-0 items-center">
				{icon}
			</span>
			<span className="flex-1 truncate text-left">{label}</span>
		</div>
	);
}

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

	const sidebarContent = (
		<div
			className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground"
			onMouseLeave={() => closeSidebar()}
		>
			{/* Header: Logo + app name + pin toggle */}
			<div className="relative z-0 flex items-center px-4 pt-3 pb-3">
				<Link
					to={"/"}
					aria-label={"Go Home"}
					className="flex flex-1 cursor-pointer items-center gap-2 rounded-md p-1 text-inherit no-underline hover:bg-accent"
				>
					{configStore.theme.logo ? (
						<img src={configStore.theme.logo} alt="theme-icon" />
					) : null}
					<span className="font-bold text-lg leading-tight">
						{configStore.theme.name}
					</span>
				</Link>

				<Button
					variant="ghost"
					size="icon-sm"
					className="shrink-0 rounded-[7.5px] border border-border p-[3.75px] focus:outline-none focus-visible:border-transparent focus-visible:ring-0"
					onClick={() => {
						if (page.sidebar.pinned) {
							page.unpinSidebar();
						} else {
							page.pinSidebar();
							return;
						}
						closeSidebar();
					}}
				>
					<PanelLeftOpen className="size-5" />
				</Button>
			</div>

			<Separator />

			{/* Home navigation */}
			<div className="overflow-y-auto">
				<ul className="list-none p-0" aria-label="main navigation">
					<li className="py-0.5">
						<Link
							to={"/"}
							aria-label={"Home"}
							className="text-inherit no-underline"
						>
							<NavButton
								icon={<Home className="size-4" />}
								label="Home"
								ariaLabel="Home"
								selected={!!matchPath("/", pathname)}
							/>
						</Link>
					</li>
				</ul>
			</div>

			<Separator />

			{/* Catalog navigation */}
			{viewSidebar ? (
				<div className="overflow-y-auto">
					<ul
						className="list-none p-0"
						aria-label="catalog navigation"
					>
						<li className="px-4 py-2">
							<span className="font-semibold text-muted-foreground text-xs">
								Catalog
							</span>
						</li>
						{CATALOG_ROUTES.map((r) => (
							<li key={r.route} className="py-0.5">
								<Link
									to={r.route}
									aria-label={r.text}
									className="text-inherit no-underline"
								>
									<NavButton
										icon={r.icon}
										label={r.text}
										ariaLabel={r.text}
										selected={
											!!matchPath(
												`${r.route}/*`,
												pathname,
											)
										}
										testId={formatToDataTestId(
											`sidebar-${r.text}-btn`,
										)}
									/>
								</Link>
							</li>
						))}
					</ul>
				</div>
			) : (
				<div />
			)}

			<Separator />

			{/* Settings */}
			<div className="flex-1 overflow-y-auto">
				<ul className="list-none p-0">
					<li className="py-0.5">
						<Link
							to={"/settings"}
							aria-label={"Settings"}
							className="text-inherit no-underline"
						>
							<NavButton
								icon={<Settings className="size-4" />}
								label="Settings"
								ariaLabel="Settings"
								selected={!!matchPath("/settings/*", pathname)}
							/>
						</Link>
					</li>
				</ul>
			</div>

			<Separator />

			{/* Footer: User / Logout */}
			<div>
				<ul className="list-none p-0" aria-label="user navigation">
					<li>
						<LogoutPopover onOpenChange={setIsLogoutPopoverOpen}>
							<NavButton
								icon={<CircleUserRound className="size-6" />}
								label={
									<span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
										{configStore.store.user.name || ""}
									</span>
								}
								ariaLabel="Login"
							/>
						</LogoutPopover>
					</li>
				</ul>
			</div>
		</div>
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
