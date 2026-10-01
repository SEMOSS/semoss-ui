import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
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
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
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
 * Renders the WorkspacePage, allowing users to access their workspace or discover new ones
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "notifications", "common"]);
	const navigate = useNavigate();
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();

	const [filters, setFilters] = useState<AgentFilter[]>([]);
	const [sort, setSort] = useState<SortOption>("name");
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const { chat } = useChat();

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			buildCatalogPixel(filters, debouncedSearch, sort, limit, offset),
		(response) => {
			// if its less than the limit, we know its the end
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

	/**
	 * Setup infinite scroll for the command list
	 */
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
		? root.theme.images.workspaceDark
		: root.theme.images.workspace;

	return (
		<div
			ref={(el) => {
				if (el) setScroll(el);
			}}
			className="@container h-full w-full overflow-y-auto"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				<div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
					<div className="min-w-0 flex-1">
						<h1 className="font-semibold text-2xl tracking-tight">
							{t("workspace:catalog.title")}
						</h1>
						<p className="mt-2 max-w-2xl text-muted-foreground text-sm">
							{t("workspace:catalog.description")}
						</p>
					</div>
					<Button onClick={() => navigate("/agent/new")}>
						{t("workspace:actions.createAgent")}
					</Button>
					{src && (
						<img
							src={src}
							alt={t("workspace:images.agentIllustration")}
							className="max-h-32 w-full rounded-xl object-cover"
						/>
					)}
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex @md:flex-row flex-col gap-2">
						<InputGroup className="flex-1 bg-background">
							<InputGroupInput
								aria-label={t("common:buttons.search")}
								placeholder={t("common:buttons.search")}
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
								{(
									Object.keys(SORT_OPTIONS) as SortOption[]
								).map((option) => (
									<SelectItem key={option} value={option}>
										{t(`workspace:catalog.sort.${option}`)}
									</SelectItem>
								))}
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

					{getWorkspaces.isLoading &&
					getWorkspaces.data.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					) : getWorkspaces.data.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<Muted>{t("workspace:messages.noResults")}</Muted>
						</div>
					) : (
						<div className="grid @2xl:grid-cols-2 @3xl:grid-cols-3 grid-cols-1 gap-4">
							{getWorkspaces.data.map((w) => (
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
							))}
						</div>
					)}

					{getWorkspaces.isLoading &&
						getWorkspaces.data.length > 0 && (
							<div className="flex items-center justify-center p-4">
								<Spinner className="size-4" />
							</div>
						)}
				</div>
			</div>
		</div>
	);
});
