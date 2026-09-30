import { PlusIcon, SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
	useTheme,
} from "@semoss/ui/next";
import workspaceImage from "@/assets/img/workspace.png";
import workspaceImageDark from "@/assets/img/workspace-darkmode.png";
import { WorkspaceCard } from "@/components";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { App } from "@/types";

/**
 * The filters offered, in display order. The access filters keep the agents
 * whose effective permission is any of those chosen; Created by Me narrows to
 * the agents the user made, under any of their logins.
 */
const AGENT_FILTERS = ["createdByMe", "owner", "edit", "view"] as const;
type AgentFilter = (typeof AGENT_FILTERS)[number];

/** The permission level each access filter keeps. */
const FILTER_PERMISSIONS: Partial<Record<AgentFilter, number>> = {
	owner: 1,
	edit: 2,
	view: 3,
};

/** The orderings offered, in display order, with the sort each sends. */
const SORT_OPTIONS = {
	name: '{"PROJECTNAME": "ASC"}',
	newest: '{"DATECREATED": "DESC"}',
	edited: '{"DATELASTEDITED": "DESC"}',
} as const;
type SortOption = keyof typeof SORT_OPTIONS;

const PAGE_SIZE = 25;

const isAgentFilter = (value: string): value is AgentFilter =>
	AGENT_FILTERS.some((filter) => filter === value);

const isSortOption = (value: string): value is SortOption =>
	value in SORT_OPTIONS;

/**
 * Build the pixel that lists one page of the user's agents: every agent they
 * can use, narrowed by the chosen filters.
 *
 * @param filters - The chosen filters; none for every agent.
 * @param search - What the user typed; empty for no search.
 * @param sort - The ordering.
 * @param limit - The page size.
 * @param offset - How many agents to skip.
 * @return The pixel.
 */
const buildCatalogPixel = (
	filters: readonly AgentFilter[],
	search: string,
	sort: SortOption,
	limit: number,
	offset: number,
): string => {
	const filterWord = search
		? `filterWord=["<encode>${search}</encode>"], `
		: "";
	const permissions = filters.flatMap((filter) => {
		const level = FILTER_PERMISSIONS[filter];
		return level === undefined ? [] : [level];
	});
	const permissionFilter =
		permissions.length > 0
			? `effectivePermissions=${JSON.stringify(permissions)}, `
			: "";
	const createdByMe = filters.includes("createdByMe")
		? "createdByMe=[true], "
		: "";
	return `META | MyProjects(${filterWord}projectType=["WORKSPACE"], ${permissionFilter}${createdByMe}sort=[${SORT_OPTIONS[sort]}], limit=[${limit}], offset=[${offset}])`;
};

/**
 * The user's permission on an agent, as the card shows it. A global agent the
 * user holds no grant on is one they can use but not change.
 *
 * @param app - The agent, as the list returns it.
 * @return The permission.
 */
const toCardPermission = (app: App): "OWNER" | "EDIT" | "READ_ONLY" =>
	app.permission === 1
		? "OWNER"
		: app.permission === 2
			? "EDIT"
			: "READ_ONLY";

/**
 * My Agents: every agent the user can use, on one page. The list is
 * searchable and sortable, and filters narrow it to the agents the user
 * created or to their access (owner, can edit, view only).
 */
export const WorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "notifications", "common"]);
	const navigate = useNavigate();
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();
	const { chat } = useChat();

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
		],
	});

	const [filters, setFilters] = useState<AgentFilter[]>([]);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [sort, setSort] = useState<SortOption>("name");

	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			buildCatalogPixel(filters, debouncedSearch, sort, limit, offset),
		(response) => {
			// a short page is the last one
			if (response.length < PAGE_SIZE) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: PAGE_SIZE,
		},
		[filters, debouncedSearch, sort],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	// theme == dark or system matches
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	const src = isDark
		? root.theme.images.workspaceDark || workspaceImageDark
		: root.theme.images.workspace || workspaceImage;

	const isFirstLoad =
		getWorkspaces.isLoading && getWorkspaces.data.length === 0;
	const isEmpty = !getWorkspaces.isLoading && getWorkspaces.data.length === 0;
	const isFiltered = filters.length > 0 || !!debouncedSearch;
	// someone with no agents yet sees the welcome instead
	const isWelcome = isEmpty && !isFiltered;

	return (
		<div
			ref={(el) => {
				if (el) setScroll(el);
			}}
			className="@container h-full w-full overflow-y-auto"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="flex min-w-0 flex-col gap-1">
						<H3>{t("workspace:catalog.title")}</H3>
						<Muted>{t("workspace:catalog.description")}</Muted>
					</div>
					<Button onClick={() => navigate("/agent/new")}>
						<PlusIcon />
						{t("workspace:actions.createAgent")}
					</Button>
				</div>

				<div className="flex @md:flex-row flex-col gap-2">
					<InputGroup className="flex-1 bg-background">
						<InputGroupInput
							placeholder={t("common:buttons.search")}
							aria-label={t("common:buttons.search")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>
					<Select
						value={sort}
						onValueChange={(value) => {
							if (isSortOption(value)) {
								setSort(value);
							}
						}}
					>
						<SelectTrigger
							aria-label={t("workspace:catalog.sort.label")}
							className="@md:w-48 w-full bg-background"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(Object.keys(SORT_OPTIONS) as SortOption[]).map(
								(option) => (
									<SelectItem key={option} value={option}>
										{t(`workspace:catalog.sort.${option}`)}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>

				<ToggleGroup
					type="multiple"
					variant="outline"
					size="sm"
					spacing={2}
					className="flex-wrap"
					aria-label={t("workspace:catalog.filters.label")}
					value={filters}
					onValueChange={(values) =>
						setFilters(values.filter(isAgentFilter))
					}
				>
					{AGENT_FILTERS.map((filter) => (
						<ToggleGroupItem key={filter} value={filter}>
							{t(`workspace:catalog.filters.${filter}`)}
						</ToggleGroupItem>
					))}
				</ToggleGroup>

				{isFirstLoad ? (
					<div className="flex items-center justify-center py-12">
						<Spinner />
					</div>
				) : isWelcome ? (
					<div className="flex w-full rounded-lg bg-primary/10">
						<div className="flex flex-1 flex-col gap-4 p-6 font-sans">
							<div className="font-medium text-primary text-xl leading-normal dark:text-white">
								{t("workspace:welcomeTitle")}
							</div>
							<div className="font-normal text-base text-primary leading-normal dark:text-white">
								{t("workspace:welcomeDescription")}
							</div>
							<Button
								onClick={() => navigate("/agent/new")}
								className="w-auto self-start"
							>
								{t("workspace:actions.createAgent")}
							</Button>
						</div>
						{/* Image appears only on large screens and above */}
						<div className="relative @3xl:block hidden w-[351px] overflow-hidden rounded-e-lg">
							<img
								src={src}
								alt={t("workspace:images.agentIllustration")}
								className="-translate-y-1/2 absolute start-0 top-1/2 h-[351px] w-full select-none object-cover"
							/>
						</div>
					</div>
				) : isEmpty ? (
					<div className="flex items-center justify-center py-12">
						<Muted>{t("workspace:messages.noResults")}</Muted>
					</div>
				) : (
					<div className="grid @2xl:grid-cols-2 @3xl:grid-cols-3 grid-cols-1 gap-4 @4xl:gap-x-8">
						{getWorkspaces.data.map((w) => {
							return (
								<WorkspaceCard
									key={w.project_id}
									workspace={{
										workspace_id: w.project_id,
										name:
											w.project_display_name ||
											w.project_name,
										description: w.description ?? "",
									}}
									permission={toCardPermission(w)}
									dateCreated={w.project_date_created}
									onDeleteClick={async () => {
										try {
											await chat.deleteWorkspace(
												w.project_id,
											);

											getWorkspaces.reset();
										} catch (e) {
											toast.error(
												e instanceof Error
													? e.message
													: t(
															"notifications:workspace.deleteError",
														),
											);
										}
									}}
								/>
							);
						})}
					</div>
				)}

				{getWorkspaces.isLoading && getWorkspaces.data.length > 0 && (
					<div className="flex items-center justify-center p-4">
						<Spinner className="size-4" />
					</div>
				)}
			</div>
		</div>
	);
});
