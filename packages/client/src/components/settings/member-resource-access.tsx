import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import {
	type AccessKind,
	editUserAccess,
	getAllUserEngines,
	getAllUserProjects,
	getUserEnginesNoCredentials,
	getUserProjectsNoCredentials,
	grantUserAccess,
	revokeUserAccess,
	type UserAccessPageOptions,
	type UserInsightAccess,
	type UserResourceAccess,
} from "@/api";
import { useAPI, useIteratorApi, useSettings } from "@/hooks";
import type { Role } from "@/types";
import type { GrantCandidate } from "./user-access-grant-overlay";
import { UserAccessGrantOverlay } from "./user-access-grant-overlay";
import { UserAccessTable } from "./user-access-table";

const ENGINE_TYPE_OPTIONS = [
	"DATABASE",
	"MODEL",
	"VECTOR",
	"STORAGE",
	"FUNCTION",
	"GUARDRAIL",
];

const PROJECT_TYPE_OPTIONS = ["CODE", "BLOCKS", "SKILL", "WORKSPACE"];

/** Page size for the infinite-scroll lists. */
const PAGE_SIZE = 25;

/** Wire permission values that count as "has access". */
const HAS_ACCESS = new Set<string>(["OWNER", "EDIT", "READ_ONLY"]);

export interface MemberResourceAccessProps {
	/** The user whose access is being managed */
	userId: string;
	/** Which kind of resource this section manages */
	kind: AccessKind;
	/** Selected project — required (and only used) when kind is INSIGHT */
	projectId?: string;
}

/**
 * A self-contained section that lists and edits a single user's access to one
 * kind of resource (apps, engines, or a project's insights).
 *
 * Apps and engines are paginated + infinite-scrolled (server-side search and
 * type filter) via useIteratorApi — the catalogs are large enough that
 * unbounded fetches were crashing the backend. Insights are project-scoped and
 * bounded, so they stay on the simpler useAPI path.
 */
export const MemberResourceAccess = ({
	userId,
	kind,
	projectId,
}: MemberResourceAccessProps) => {
	const { adminMode } = useSettings();

	const isInsight = kind === "INSIGHT";
	const isEngine = kind === "ENGINE";
	const typeOptions = isEngine ? ENGINE_TYPE_OPTIONS : PROJECT_TYPE_OPTIONS;

	const [busy, setBusy] = useState(false);
	const [grantOpen, setGrantOpen] = useState(false);
	const [grantSearch, setGrantSearch] = useState("");
	const debouncedGrantSearch = useDebouncedValue(grantSearch);
	// Server-side type filters: one for the current-access table, one for the
	// grant catalog. "ALL" means no filter.
	const [tableType, setTableType] = useState<string>("ALL");
	const [grantType, setGrantType] = useState<string>("ALL");

	// Insights are bounded and project-scoped — keep them on useAPI. Only the
	// active INSIGHT section fires a request (empty tuple ⇒ idle).
	const insightsApi = useAPI(
		(isInsight && projectId
			? ["getAllProjectInsightUsers", adminMode, projectId, userId]
			: []) as unknown as [
			"getAllProjectInsightUsers",
			boolean,
			string,
			string,
		],
	);

	// Current access (apps/engines) — paginated, type-filtered, infinite scroll.
	const tableIterator = useIteratorApi<UserResourceAccess>(
		(limit, offset) => {
			const options: UserAccessPageOptions = {
				types: tableType === "ALL" ? undefined : [tableType],
				limit,
				offset,
			};
			return isEngine
				? getAllUserEngines(adminMode, userId, options)
				: getAllUserProjects(adminMode, userId, options);
		},
		{ enabled: !isInsight, limit: PAGE_SIZE },
		[kind, adminMode, userId, tableType],
	);

	// Grant catalog (apps/engines the user lacks) — paginated, searchable.
	const grantIterator = useIteratorApi<GrantCandidate>(
		(limit, offset) => {
			const options: UserAccessPageOptions = {
				types: grantType === "ALL" ? undefined : [grantType],
				searchTerm: debouncedGrantSearch || undefined,
				limit,
				offset,
			};
			return isEngine
				? getUserEnginesNoCredentials(adminMode, userId, options)
				: getUserProjectsNoCredentials(adminMode, userId, options);
		},
		{ enabled: grantOpen && !isInsight, limit: PAGE_SIZE },
		[kind, adminMode, userId, grantType, debouncedGrantSearch],
	);

	// Stable onNext refs so useInfiniteScroll doesn't tear down its listener each
	// time the iterator's `next` identity changes (mirrors engine-select.tsx).
	const tableNextRef = useRef(tableIterator.next);
	useEffect(() => {
		tableNextRef.current = tableIterator.next;
	}, [tableIterator.next]);
	const handleTableNext = useCallback(() => tableNextRef.current(), []);

	const grantNextRef = useRef(grantIterator.next);
	useEffect(() => {
		grantNextRef.current = grantIterator.next;
	}, [grantIterator.next]);
	const handleGrantNext = useCallback(() => grantNextRef.current(), []);

	const { setScroll: setTableScroll } = useInfiniteScroll({
		disabled:
			isInsight || tableIterator.isLoading || !tableIterator.hasMore,
		onNext: handleTableNext,
	});
	const { setScroll: setGrantScroll } = useInfiniteScroll({
		disabled:
			isInsight ||
			!grantOpen ||
			grantIterator.isLoading ||
			!grantIterator.hasMore,
		onNext: handleGrantNext,
	});

	// Rows / candidates: insights come from useAPI, apps/engines from iterators.
	const insights = (insightsApi.data as UserInsightAccess[]) ?? [];
	const insightsLoading =
		insightsApi.status === "INITIAL" || insightsApi.status === "LOADING";

	const tableRows: UserResourceAccess[] = isInsight
		? insights.filter((row) => HAS_ACCESS.has(row.permission))
		: tableIterator.data;
	const tableLoading = isInsight
		? insightsLoading
		: tableIterator.isLoading && tableIterator.data.length === 0;
	const tableLoadingMore =
		!isInsight && tableIterator.isLoading && tableIterator.data.length > 0;

	const grantCandidates: GrantCandidate[] = (() => {
		if (!isInsight) {
			return grantIterator.data;
		}
		const list = insights
			.filter((row) => !HAS_ACCESS.has(row.permission))
			.map((row) => ({ id: row.id, name: row.name }));
		const search = grantSearch.trim().toLowerCase();
		return search === ""
			? list
			: list.filter(
					(item) =>
						item.name.toLowerCase().includes(search) ||
						item.id.toLowerCase().includes(search),
				);
	})();
	const grantLoading = isInsight
		? insightsLoading
		: grantIterator.isLoading && grantIterator.data.length === 0;
	const grantLoadingMore =
		!isInsight && grantIterator.isLoading && grantIterator.data.length > 0;

	const refresh = () => {
		if (isInsight) {
			insightsApi.refresh();
		} else {
			tableIterator.reset();
		}
	};

	const openGrant = () => {
		// Start each grant session from a clean first page.
		grantIterator.reset();
		setGrantOpen(true);
	};

	const closeGrant = () => {
		setGrantOpen(false);
		setGrantSearch("");
	};

	const runMutation = async (
		action: () => Promise<boolean>,
		successMessage: string,
	) => {
		setBusy(true);
		try {
			const ok = await action();
			if (ok) {
				toast.success(successMessage);
				refresh();
			} else {
				toast.error("The request did not succeed");
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setBusy(false);
		}
	};

	const handleEdit = (row: UserResourceAccess, permission: Role) => {
		runMutation(
			() =>
				editUserAccess(
					kind,
					adminMode,
					{ resourceId: row.id, userId, projectId },
					permission,
				),
			"Permission updated",
		);
	};

	const handleRemove = (row: UserResourceAccess) => {
		runMutation(
			() =>
				revokeUserAccess(kind, adminMode, {
					resourceId: row.id,
					userId,
					projectId,
				}),
			"Access removed",
		);
	};

	const handleGrant = async (
		selected: GrantCandidate[],
		permission: Role,
	) => {
		setBusy(true);
		try {
			const results = await Promise.all(
				selected.map((candidate) =>
					grantUserAccess(
						kind,
						adminMode,
						{ resourceId: candidate.id, userId, projectId },
						permission,
					).catch(() => false),
				),
			);
			const granted = results.filter(Boolean).length;
			if (granted > 0) {
				toast.success(
					`Granted access to ${granted} ${
						granted === 1 ? "resource" : "resources"
					}`,
				);
			}
			if (granted < selected.length) {
				toast.error(
					`Failed to grant ${selected.length - granted} of ${selected.length}`,
				);
			}
			closeGrant();
			refresh();
		} finally {
			setBusy(false);
		}
	};

	const grantTitle = isInsight
		? "Grant Insight Access"
		: isEngine
			? "Grant Engine Access"
			: "Grant App Access";

	const renderResourceIcon = (resource: {
		id?: string;
		name: string;
		type?: string;
		subtype?: string;
	}) =>
		isEngine ? (
			<EngineSubtypeIcon
				engineType={resource.type || "DATABASE"}
				engineSubtype={resource.subtype}
				className="size-8 rounded object-contain"
			/>
		) : (
			<AppCatalogAvatar
				name={resource.name || resource.id || ""}
				className="size-8 rounded-md text-xs"
			/>
		);

	const typeSelect = (
		value: string,
		onChange: (value: string) => void,
		triggerClassName: string,
	) => (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className={triggerClassName}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="ALL">All types</SelectItem>
				{typeOptions.map((type) => (
					<SelectItem key={type} value={type}>
						{type}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{isInsight
						? null
						: typeSelect(tableType, setTableType, "h-8 w-[160px]")}
				</div>
				<Button size="sm" disabled={busy} onClick={openGrant}>
					<Plus className="size-4" />
					Grant access
				</Button>
			</div>

			<UserAccessTable
				rows={tableRows}
				showType={!isInsight}
				loading={tableLoading}
				loadingMore={tableLoadingMore}
				busy={busy}
				scrollRef={isInsight ? undefined : setTableScroll}
				renderIcon={renderResourceIcon}
				onEdit={handleEdit}
				onRemove={handleRemove}
				emptyMessage={
					isInsight
						? "This user has no insight access in the selected app"
						: "This user has no access yet"
				}
			/>

			<UserAccessGrantOverlay
				open={grantOpen}
				title={grantTitle}
				candidates={grantCandidates}
				loading={grantLoading}
				loadingMore={grantLoadingMore}
				busy={busy}
				renderIcon={renderResourceIcon}
				search={grantSearch}
				onSearchChange={setGrantSearch}
				scrollRef={isInsight ? undefined : setGrantScroll}
				headerControls={
					isInsight
						? null
						: typeSelect(grantType, setGrantType, "h-9 w-[160px]")
				}
				onClose={closeGrant}
				onGrant={handleGrant}
			/>
		</div>
	);
};
