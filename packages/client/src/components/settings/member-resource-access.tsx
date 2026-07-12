import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import {
	type AccessKind,
	editUserAccess,
	grantUserAccess,
	revokeUserAccess,
	type UserInsightAccess,
	type UserResourceAccess,
} from "@/api";
import { useAPI, useSettings } from "@/hooks";
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
 * kind of resource (apps, engines, or a project's insights). Handles fetching
 * the user's current access, computing grantable candidates, and wiring the
 * grant / edit / revoke mutations.
 */
export const MemberResourceAccess = ({
	userId,
	kind,
	projectId,
}: MemberResourceAccessProps) => {
	const { adminMode } = useSettings();

	const [busy, setBusy] = useState(false);
	const [grantOpen, setGrantOpen] = useState(false);
	const [grantSearch, setGrantSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("ALL");
	const [engineType, setEngineType] = useState<string>("DATABASE");

	// Current access — only the active kind fires a request (empty tuple ⇒ idle).
	const projectsApi = useAPI(
		(kind === "APP"
			? ["getAllUserProjects", adminMode, userId]
			: []) as unknown as ["getAllUserProjects", boolean, string],
	);
	const enginesApi = useAPI(
		(kind === "ENGINE"
			? ["getAllUserEngines", adminMode, userId]
			: []) as unknown as ["getAllUserEngines", boolean, string],
	);
	const insightsApi = useAPI(
		(kind === "INSIGHT" && projectId
			? ["getAllProjectInsightUsers", adminMode, projectId, userId]
			: []) as unknown as [
			"getAllProjectInsightUsers",
			boolean,
			string,
			string,
		],
	);

	// Catalog for the grant overlay — fetched only while the overlay is open.
	const appCatalogApi = useAPI(
		(kind === "APP" && grantOpen
			? ["getUserProjectsNoCredentials", adminMode, userId]
			: []) as unknown as [
			"getUserProjectsNoCredentials",
			boolean,
			string,
		],
	);
	const engineCatalogApi = useAPI(
		(kind === "ENGINE" && grantOpen
			? ["getUserEnginesNoCredentials", adminMode, userId, engineType]
			: []) as unknown as [
			"getUserEnginesNoCredentials",
			boolean,
			string,
			string,
		],
	);

	const activeApi =
		kind === "APP"
			? projectsApi
			: kind === "ENGINE"
				? enginesApi
				: insightsApi;
	const loading =
		activeApi.status === "INITIAL" || activeApi.status === "LOADING";

	// All resources the user has access to (unfiltered) — used for exclusion.
	const allCurrent: UserResourceAccess[] = useMemo(() => {
		if (kind === "APP") {
			return (projectsApi.data as UserResourceAccess[]) ?? [];
		}
		if (kind === "ENGINE") {
			return (enginesApi.data as UserResourceAccess[]) ?? [];
		}
		const insights = (insightsApi.data as UserInsightAccess[]) ?? [];
		return insights.filter((row) => HAS_ACCESS.has(row.permission));
	}, [kind, projectsApi.data, enginesApi.data, insightsApi.data]);

	// Rows shown in the table (engines can be narrowed by the type filter).
	const rows: UserResourceAccess[] = useMemo(() => {
		if (kind === "ENGINE" && typeFilter !== "ALL") {
			return allCurrent.filter(
				(row) => (row.type ?? "").toUpperCase() === typeFilter,
			);
		}
		return allCurrent;
	}, [kind, allCurrent, typeFilter]);

	// Candidates the user does NOT yet have access to.
	const candidates: GrantCandidate[] = useMemo(() => {
		const currentIds = new Set(allCurrent.map((row) => row.id));
		let list: GrantCandidate[] = [];
		if (kind === "APP") {
			// Backend already returns only the projects this user lacks
			list =
				(appCatalogApi.data as
					| { id: string; name: string }[]
					| undefined) ?? [];
		} else if (kind === "ENGINE") {
			// Backend already returns only the engines this user lacks
			list =
				(engineCatalogApi.data as
					| {
							id: string;
							name: string;
							type?: string;
							subtype?: string;
					  }[]
					| undefined) ?? [];
		} else {
			const insights = (insightsApi.data as UserInsightAccess[]) ?? [];
			list = insights
				.filter((row) => !HAS_ACCESS.has(row.permission))
				.map((row) => ({ id: row.id, name: row.name }));
		}
		const search = grantSearch.trim().toLowerCase();
		return list.filter(
			(item) =>
				item.id &&
				!currentIds.has(item.id) &&
				(search === "" ||
					item.name.toLowerCase().includes(search) ||
					item.id.toLowerCase().includes(search)),
		);
	}, [
		kind,
		allCurrent,
		appCatalogApi.data,
		engineCatalogApi.data,
		insightsApi.data,
		grantSearch,
	]);

	const catalogLoading =
		(kind === "APP" &&
			(appCatalogApi.status === "INITIAL" ||
				appCatalogApi.status === "LOADING")) ||
		(kind === "ENGINE" &&
			(engineCatalogApi.status === "INITIAL" ||
				engineCatalogApi.status === "LOADING"));

	const refresh = () => {
		activeApi.refresh();
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
			setGrantOpen(false);
			setGrantSearch("");
			refresh();
		} finally {
			setBusy(false);
		}
	};

	const grantTitle =
		kind === "APP"
			? "Grant App Access"
			: kind === "ENGINE"
				? "Grant Engine Access"
				: "Grant Insight Access";

	const renderResourceIcon = (resource: {
		id?: string;
		name: string;
		type?: string;
		subtype?: string;
	}) =>
		kind === "ENGINE" ? (
			<EngineSubtypeIcon
				engineType={resource.type || engineType}
				engineSubtype={resource.subtype}
				className="size-8 rounded object-contain"
			/>
		) : (
			<AppCatalogAvatar
				name={resource.name || resource.id || ""}
				className="size-8 rounded-md text-xs"
			/>
		);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{kind === "ENGINE" ? (
						<Select
							value={typeFilter}
							onValueChange={setTypeFilter}
						>
							<SelectTrigger className="h-8 w-[160px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">All types</SelectItem>
								{ENGINE_TYPE_OPTIONS.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null}
				</div>
				<Button
					size="sm"
					disabled={busy}
					onClick={() => {
						setGrantSearch("");
						setGrantOpen(true);
					}}
				>
					<Plus className="size-4" />
					Grant access
				</Button>
			</div>

			<UserAccessTable
				rows={rows}
				showType={kind === "ENGINE"}
				loading={loading}
				busy={busy}
				renderIcon={renderResourceIcon}
				onEdit={handleEdit}
				onRemove={handleRemove}
				emptyMessage={
					kind === "INSIGHT"
						? "This user has no insight access in the selected app"
						: "This user has no access yet"
				}
			/>

			<UserAccessGrantOverlay
				open={grantOpen}
				title={grantTitle}
				candidates={candidates}
				loading={catalogLoading}
				busy={busy}
				renderIcon={renderResourceIcon}
				search={grantSearch}
				onSearchChange={setGrantSearch}
				headerControls={
					kind === "ENGINE" ? (
						<Select
							value={engineType}
							onValueChange={setEngineType}
						>
							<SelectTrigger className="h-9 w-[160px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ENGINE_TYPE_OPTIONS.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null
				}
				onClose={() => setGrantOpen(false)}
				onGrant={handleGrant}
			/>
		</div>
	);
};
