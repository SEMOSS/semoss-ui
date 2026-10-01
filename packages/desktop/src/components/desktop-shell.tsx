import {
	Bolt,
	ChevronLeft,
	ChevronRight,
	Cpu,
	Database,
	Home,
	LayoutGrid,
	MessagesSquare,
	PanelLeftClose,
	PanelLeftOpen,
	Settings,
	Sigma,
} from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	H1,
	Muted,
} from "@semoss/ui/next";
import type { CatalogKind } from "@/api/catalog";
import { CatalogView } from "@/components/catalog-view";
import { CatalogWorkbenchView } from "@/components/catalog-workbench-view";
import { ChatView } from "@/components/chat-view";
import { DatabaseWorkbenchView } from "@/components/database-workbench-view";
import type {
	CatalogItem,
	DesktopInstanceProfile,
	DesktopUser,
	InstanceConfig,
	InstanceTheme,
} from "@/types";

interface DesktopShellProps {
	profile: DesktopInstanceProfile;
	config: InstanceConfig;
	theme: InstanceTheme;
	user: DesktopUser | null;
	userError: string;
}

type DesktopPage = "home" | "chat" | "settings" | CatalogKind;

const primaryNavigation = [
	{ id: "home", label: "Home", icon: Home },
	{ id: "apps", label: "Apps", icon: LayoutGrid },
	{ id: "chat", label: "Chat", icon: MessagesSquare },
] as const;

const engineNavigation = [
	{ id: "models", label: "Models", icon: Cpu },
	{ id: "databases", label: "Databases", icon: Database },
	{ id: "vectors", label: "Vectors", icon: Bolt },
	{ id: "functions", label: "Functions", icon: Sigma },
] as const;

const pageLabels: Record<DesktopPage, string> = {
	home: "Home",
	apps: "Apps",
	chat: "Chat",
	models: "Models",
	databases: "Databases",
	vectors: "Vectors",
	functions: "Functions",
	settings: "Settings",
};

const quickActions = [
	{
		id: "apps",
		title: "Open an app",
		description: "Browse applications available on this instance.",
		icon: LayoutGrid,
	},
	{
		id: "models",
		title: "Explore models",
		description: "Browse model engines available to your account.",
		icon: Cpu,
	},
	{
		id: "chat",
		title: "Start a chat",
		description: "Create a room and work with models or agents.",
		icon: MessagesSquare,
	},
] as const;

export const DesktopShell = ({
	profile,
	config,
	theme,
	user,
	userError,
}: DesktopShellProps) => {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [page, setPage] = useState<DesktopPage>("chat");
	const [pageHistory, setPageHistory] = useState<DesktopPage[]>(["chat"]);
	const [pageHistoryIndex, setPageHistoryIndex] = useState(0);
	const [selectedWorkbench, setSelectedWorkbench] = useState<{
		kind: CatalogKind;
		item: CatalogItem;
	} | null>(null);
	const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
	const userName = user?.name.trim() || "";

	const navigateTo = (nextPage: DesktopPage): void => {
		if (nextPage === page) return;
		setPageHistory((current) => [
			...current.slice(0, pageHistoryIndex + 1),
			nextPage,
		]);
		setPageHistoryIndex((current) => current + 1);
		setPage(nextPage);
		setSelectedWorkbench(null);
		setIsWorkbenchOpen(false);
	};

	const navigateHistory = (direction: -1 | 1): void => {
		if (direction === -1 && isWorkbenchOpen) {
			setIsWorkbenchOpen(false);
			return;
		}
		if (direction === -1 && selectedWorkbench) {
			setSelectedWorkbench(null);
			return;
		}
		const nextIndex = pageHistoryIndex + direction;
		const nextPage = pageHistory[nextIndex];
		if (!nextPage) return;
		setPageHistoryIndex(nextIndex);
		setPage(nextPage);
		setSelectedWorkbench(null);
		setIsWorkbenchOpen(false);
	};

	const renderNavigationButton = ({
		id,
		label,
		icon: Icon,
	}: {
		id: DesktopPage;
		label: string;
		icon: typeof Home;
	}) => (
		<Button
			key={id}
			type="button"
			variant={page === id ? "secondary" : "ghost"}
			className={
				isSidebarCollapsed ? "justify-center px-0" : "justify-start"
			}
			aria-label={label}
			title={isSidebarCollapsed ? label : undefined}
			onClick={() => navigateTo(id)}
		>
			<Icon aria-hidden="true" />
			{isSidebarCollapsed ? null : label}
		</Button>
	);

	return (
		<div
			className={`grid min-h-0 flex-1 grid-rows-[3.5rem_minmax(0,1fr)] ${
				isSidebarCollapsed
					? "grid-cols-[4.5rem_minmax(0,1fr)]"
					: "grid-cols-[18rem_minmax(0,1fr)]"
			}`}
		>
			<header className="desktop-topbar col-span-2 flex items-center border-border/70 border-b">
				<div
					className={`flex h-full shrink-0 items-center gap-0.5 pr-2 ${
						isSidebarCollapsed
							? "w-[4.5rem] justify-center"
							: "w-[18rem] pl-[11.75rem]"
					}`}
					data-tauri-drag-region
				>
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						aria-label="Go back"
						title="Go back"
						disabled={
							pageHistoryIndex === 0 &&
							!selectedWorkbench &&
							!isWorkbenchOpen
						}
						onClick={() => navigateHistory(-1)}
					>
						<ChevronLeft aria-hidden="true" />
					</Button>
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						aria-label="Go forward"
						title="Go forward"
						disabled={pageHistoryIndex >= pageHistory.length - 1}
						onClick={() => navigateHistory(1)}
					>
						<ChevronRight aria-hidden="true" />
					</Button>
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						aria-label={
							isSidebarCollapsed
								? "Expand sidebar"
								: "Collapse sidebar"
						}
						aria-expanded={!isSidebarCollapsed}
						title={
							isSidebarCollapsed
								? "Expand sidebar"
								: "Collapse sidebar"
						}
						onClick={() =>
							setIsSidebarCollapsed((collapsed) => !collapsed)
						}
					>
						{isSidebarCollapsed ? (
							<PanelLeftOpen aria-hidden="true" />
						) : (
							<PanelLeftClose aria-hidden="true" />
						)}
					</Button>
				</div>
				<div
					className="flex h-full min-w-0 flex-1 items-center border-border/70 border-l px-4"
					data-tauri-drag-region
				>
					{isWorkbenchOpen && selectedWorkbench ? (
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<Button
										type="button"
										variant="link"
										className="h-auto p-0 text-muted-foreground"
										onClick={() => {
											setIsWorkbenchOpen(false);
											setSelectedWorkbench(null);
										}}
									>
										{pageLabels[selectedWorkbench.kind]}{" "}
										Catalog
									</Button>
								</BreadcrumbItem>
								<BreadcrumbSeparator>
									<ChevronRight />
								</BreadcrumbSeparator>
								<BreadcrumbItem>
									<Button
										type="button"
										variant="link"
										className="h-auto p-0 text-muted-foreground"
										onClick={() =>
											setIsWorkbenchOpen(false)
										}
									>
										{selectedWorkbench.item.name}
									</Button>
								</BreadcrumbItem>
								<BreadcrumbSeparator>
									<ChevronRight />
								</BreadcrumbSeparator>
								<BreadcrumbItem>
									<BreadcrumbPage>Workbench</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					) : (
						<span className="truncate font-semibold">
							{selectedWorkbench?.item.name ||
								theme.name ||
								"AI Core"}
						</span>
					)}
				</div>
			</header>

			<aside className="desktop-sidebar flex min-h-0 flex-col border-border/70 border-r p-3">
				<nav
					aria-label="Primary navigation"
					className="mt-2 flex flex-col gap-1"
				>
					{primaryNavigation.map((item) =>
						renderNavigationButton(item),
					)}
					{isSidebarCollapsed ? (
						<div className="my-2 border-border/70 border-t" />
					) : (
						<p className="mt-4 px-3 text-muted-foreground text-xs uppercase tracking-wide">
							Catalog
						</p>
					)}
					{engineNavigation.map((item) =>
						renderNavigationButton(item),
					)}
				</nav>

				<div className="flex-1" />
				{renderNavigationButton({
					id: "settings",
					label: "Settings",
					icon: Settings,
				})}
				{isSidebarCollapsed ? null : (
					<div className="mt-3 border-border/70 border-t pt-3">
						<p className="truncate px-3 text-sm">
							{userName || "Account"}
						</p>
					</div>
				)}
			</aside>

			<div className="flex min-h-0 min-w-0 flex-col">
				<main
					className={
						isWorkbenchOpen ||
						(page === "chat" && !selectedWorkbench)
							? "min-h-0 flex-1 overflow-hidden"
							: "min-h-0 flex-1 overflow-auto"
					}
				>
					<div
						className={
							isWorkbenchOpen ||
							(page === "chat" && !selectedWorkbench)
								? "h-full"
								: "mx-auto w-full max-w-[1550px] px-4 pt-6 sm:px-6 md:px-8 lg:px-10 xl:px-12"
						}
					>
						{page === "home" ? (
							<div className="mx-auto max-w-5xl">
								<Muted>{profile.displayName}</Muted>
								<H1 className="mt-2">
									{userName
										? `Hello, ${userName}. Welcome back.`
										: "Welcome back."}
								</H1>

								{userError ? (
									<Alert
										variant="destructive"
										className="mt-5"
									>
										<AlertDescription>
											Unable to load your profile:{" "}
											{userError}
										</AlertDescription>
									</Alert>
								) : null}

								<div className="mt-8 grid gap-4 md:grid-cols-3">
									{quickActions.map(
										({
											id,
											title,
											description,
											icon: Icon,
										}) => (
											<button
												key={id}
												type="button"
												className="group flex min-h-44 flex-col rounded-xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												onClick={() => navigateTo(id)}
											>
												<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
													<Icon
														aria-hidden="true"
														className="size-5"
													/>
												</span>
												<span className="mt-6 flex items-center font-semibold">
													{title}
													<ChevronRight
														aria-hidden="true"
														className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
													/>
												</span>
												<span className="mt-2 text-muted-foreground text-sm">
													{description}
												</span>
											</button>
										),
									)}
								</div>
							</div>
						) : null}

						{page === "apps" ||
						page === "models" ||
						page === "vectors" ||
						page === "databases" ||
						page === "functions" ? (
							selectedWorkbench ? (
								isWorkbenchOpen ? (
									selectedWorkbench.kind === "databases" ? (
										<DatabaseWorkbenchView
											item={selectedWorkbench.item}
											profile={profile}
											config={config}
										/>
									) : selectedWorkbench.kind === "models" ? (
										<ChatView
											profile={profile}
											config={config}
											user={user}
											initialModelId={
												selectedWorkbench.item.id
											}
											lockModel
										/>
									) : null
								) : (
									<CatalogWorkbenchView
										kind={selectedWorkbench.kind}
										item={selectedWorkbench.item}
										profile={profile}
										config={config}
										onOpenWorkbench={
											selectedWorkbench.kind ===
												"databases" ||
											selectedWorkbench.kind === "models"
												? () => setIsWorkbenchOpen(true)
												: undefined
										}
									/>
								)
							) : (
								<CatalogView
									kind={page}
									profile={profile}
									config={config}
									onOpenItem={(item) => {
										setSelectedWorkbench({
											kind: page,
											item,
										});
										setIsWorkbenchOpen(false);
									}}
								/>
							)
						) : null}

						{page === "chat" ? (
							<ChatView
								profile={profile}
								config={config}
								user={user}
							/>
						) : null}

						{page === "settings" ? (
							<div className="mx-auto max-w-4xl">
								<H1>Settings</H1>
								<p className="mt-2 text-muted-foreground">
									Appearance, instance details, updates, and
									session controls will live here.
								</p>
							</div>
						) : null}
					</div>
				</main>
			</div>
		</div>
	);
};
