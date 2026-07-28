import { useMemo } from "react";
import {
	matchPath,
	Outlet,
	useLocation,
	useParams,
	useResolvedPath,
} from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import { Muted, Spinner, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { EngineHeader } from "@/components/engine";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import type { Role } from "@/types";
import type { ENGINE_ROUTES } from "./engine.constants";

interface EngineLayoutProps {
	/** Rotue to render */
	route: (typeof ENGINE_ROUTES)[number];
}

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineLayout: React.FC<EngineLayoutProps> = ({ route }) => {
	const { engineId } = useParams();
	const { configStore } = useRootStore();
	const resolvedPath = useResolvedPath("");
	const { pathname, state: locationStateRaw } = useLocation();
	const navigate = useNavigate();

	// filter metakeys to the ones we want
	const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
		(k) => {
			return (
				k.metakey !== "description" &&
				k.metakey !== "markdown" &&
				k.metakey !== "tags"
			);
		},
	);

	// kets to get dbMetaData for
	const metaKeys = [
		"markdown",
		"description",
		...engineMetaKeys.map((k) => k.metakey),
	];

	// get the metadata
	const getEngineMetadata = usePixel<{
		engine_name?: string;
		engine_display_name?: string;
		engine_discoverable?: boolean;
		engine_created_by?: string;
		engine_date_created?: string;
		last_updated?: string;
		description?: string;
		engine_type?: string;
		engine_subtype?: string;
		engine_id?: string;
		engine_global?: boolean;
		engine_cost?: string;
		markdown?: string;
		tags?: string[];
	}>(
		engineId
			? `GetEngineMetadata(engine=["${engineId}"], metaKeys=${JSON.stringify(
					[metaKeys],
				)}); `
			: "",
		{
			data: {},
		},
	);

	// get the database category to check if it's SQL (only for DATABASE type engines)
	const getDatabaseCategory = usePixel<string>(
		engineId && route.type === "DATABASE"
			? `GetDatabaseCategory(engine=["${engineId}"]);`
			: "",
		{
			data: "",
		},
	);

	// check if ENABLE_MIGRATIONS is set on the engine's smss (only for DATABASE
	// type engines) -- the Migrations tab only shows when this is true
	const getMigrationsEnabled = usePixel<boolean>(
		engineId && route.type === "DATABASE"
			? `GetEngineMigrationsEnabled(engine=["${engineId}"]);`
			: "",
		{
			data: false,
		},
	);

	// convert the data into an object
	// biome-ignore lint/correctness/useExhaustiveDependencies: pre-existing dep array uses JSON.stringify for stability
	const values = useMemo(() => {
		if (getEngineMetadata.status !== "SUCCESS") {
			return {};
		}

		// Storage and Model currently not sending back Tag or Tags
		return metaKeys.reduce((prev, curr) => {
			// tag, domain, and etc either come in as a string or a string[], format it to correct type
			const found = engineMetaKeys.find((obj) => obj.metakey === curr);

			if (found) {
				if (
					found.display_options === "single-typeahead" ||
					found.display_options === "select-box" ||
					found.display_options === "multi-typeahead"
				) {
					if (typeof getEngineMetadata?.data[curr] === "string") {
						prev[curr] = [getEngineMetadata?.data[curr]];
					} else {
						prev[curr] = getEngineMetadata?.data[curr];
					}
				}
			} else {
				prev[curr] = getEngineMetadata?.data[curr];
			}

			return prev;
		}, {});
	}, [
		getEngineMetadata.status,
		getEngineMetadata?.data,
		JSON.stringify(metaKeys),
	]);

	// read navigation state set by the engine catalog when opening a discoverable engine
	const locationState = locationStateRaw as {
		fromDiscoverable?: boolean;
		engineName?: string;
		engineDescription?: string;
		engineSubtype?: string;
		engineCreatedBy?: string;
		engineDateCreated?: string;
		engineTags?: string[];
	} | null;

	// get the user's role
	const getUserEnginePermission = useAPI(
		engineId ? ["getUserEnginePermission", engineId] : null,
	);

	// resolve discoverable status from either the permission API or the navigation context
	const permissionFromApi = getUserEnginePermission.data?.permission;
	const isDiscoverableAccess =
		permissionFromApi === "DISCOVERABLE" ||
		(getUserEnginePermission.status === "ERROR" &&
			locationState?.fromDiscoverable === true);

	// resolved role used in the context: fall back to DISCOVERABLE when the API errored but we came from the discoverable catalog
	const resolvedRole: Role = isDiscoverableAccess
		? "DISCOVERABLE"
		: (permissionFromApi ?? "READ_ONLY");

	// get the tabs based on permission and database type
	// biome-ignore lint/correctness/useExhaustiveDependencies: pre-existing dep array shape
	const tabs = useMemo(() => {
		// must be valid
		if (!route) {
			return [];
		}

		// for discoverable users only show unrestricted tabs (Overview)
		if (isDiscoverableAccess) {
			return route.specific.filter((t) => !t.restrict);
		}

		if (
			getUserEnginePermission.status !== "SUCCESS" ||
			!getUserEnginePermission.data
		) {
			return [];
		}

		// check the permission
		const permission = getUserEnginePermission.data.permission;

		// get the routes based on permission
		let filteredTabs = route.specific.filter((t) =>
			t.restrict ? t.restrict.indexOf(permission) > -1 : true,
		);

		// additional filtering for DATABASE type engines - hide Query/SPARQL tabs based on category,
		// and hide Migrations unless ENABLE_MIGRATIONS is set on the engine's smss
		if (route.type === "DATABASE") {
			const databaseCategory = getDatabaseCategory.data;
			const migrationsEnabled = getMigrationsEnabled.data;
			filteredTabs = filteredTabs.filter((t) => {
				if (t.path === "query") {
					return databaseCategory === "SQL";
				}
				if (t.path === "sparql-query") {
					return databaseCategory === "RDF";
				}
				if (t.path === "migrations") {
					return migrationsEnabled === true;
				}
				return true;
			});
		}

		return filteredTabs;
	}, [
		route,
		isDiscoverableAccess,
		getUserEnginePermission.status,
		getUserEnginePermission.data
			? getUserEnginePermission.data.permission
			: "",
		getDatabaseCategory.data,
		getMigrationsEnabled.data,
	]);

	/**
	 * Gets active tab
	 * @returns index of selectedTab
	 */
	const activeTabIdx: number = useMemo(() => {
		if (!route) {
			return -1;
		}

		for (let tabIdx = 0, tabLen = tabs.length; tabIdx < tabLen; tabIdx++) {
			if (
				matchPath(
					`${resolvedPath.pathname}/${tabs[tabIdx].path}`,
					pathname,
				)
			) {
				return tabIdx;
			}
		}

		return -1;
	}, [route, tabs, resolvedPath, pathname]);

	// whether we're on the edit route for this engine
	const isEdit = Boolean(
		matchPath(`${resolvedPath.pathname}/edit`, pathname),
	);

	// if the engine ID is missing, navigate to the list
	if (!engineId) {
		return <ResourceNotFound path={route.path} />;
	}

	// for non-discoverable users show not-found when access is denied
	if (!isDiscoverableAccess && getUserEnginePermission.status === "ERROR") {
		return <ResourceNotFound path={route.path} />;
	}

	// show a loading screen while checking access (not yet settled and not a known error)
	if (
		getUserEnginePermission.status !== "SUCCESS" &&
		getUserEnginePermission.status !== "ERROR"
	) {
		return (
			<div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
				<Spinner className="size-4" />
				<Muted>Checking Access</Muted>
			</div>
		);
	}

	// for non-discoverable users wait for metadata to load
	// for discoverable users we proceed even when metadata errors (limited view)
	if (!isDiscoverableAccess && getEngineMetadata.status !== "SUCCESS") {
		return (
			<div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
				<Spinner className="size-4" />
				<Muted>Opening</Muted>
			</div>
		);
	}

	// for discoverable users still wait while metadata is initially loading
	if (
		isDiscoverableAccess &&
		(getEngineMetadata.status === "LOADING" ||
			getEngineMetadata.status === "INITIAL")
	) {
		return (
			<div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
				<Spinner className="size-4" />
				<Muted>Opening</Muted>
			</div>
		);
	}

	// show a loading screen when checking database category for DATABASE engines (non-discoverable only)
	if (
		!isDiscoverableAccess &&
		route.type === "DATABASE" &&
		(getDatabaseCategory.status !== "SUCCESS" ||
			getMigrationsEnabled.status !== "SUCCESS")
	) {
		return (
			<div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
				<Spinner className="size-4" />
				<Muted>Loading Metadata</Muted>
			</div>
		);
	}

	return (
		<EngineContext.Provider
			value={{
				type: route.type,
				path: route.path,
				name: route.name,
				active: {
					id: engineId,
					role: resolvedRole,
					name:
						(getEngineMetadata.data
							?.engine_display_name as string) ||
						(getEngineMetadata.data?.engine_name as string) ||
						locationState?.engineName ||
						"",
					metadata: {
						...values,
						description:
							(values as Record<string, unknown>).description ??
							locationState?.engineDescription,
						tag:
							(values as Record<string, unknown>).tag ??
							locationState?.engineTags,
					},
					engine_subtype:
						getEngineMetadata.data?.engine_subtype ||
						locationState?.engineSubtype,
					engine_created_by:
						getEngineMetadata.data?.engine_created_by ||
						locationState?.engineCreatedBy,
					engine_date_created:
						getEngineMetadata.data?.engine_date_created ||
						locationState?.engineDateCreated,
					last_updated: getEngineMetadata.data?.last_updated,
					refresh: getEngineMetadata.refresh,
				},
			}}
		>
			{!isEdit ? (
				<div className="flex flex-col gap-4">
					<EngineHeader />
					<div className="flex flex-col rounded-lg bg-(--muted)">
						{tabs.length > 0 && (
							<div>
								<Tabs
									value={
										activeTabIdx !== -1
											? tabs[activeTabIdx].path
											: undefined
									}
									className="gap-0 bg-transparent"
								>
									<div className="w-full overflow-x-auto md:w-[80%]">
										<TabsList className="w-max flex-nowrap gap-2">
											{tabs.map((t) => (
												<TabsTrigger
													key={t.path}
													value={t.path}
													onClick={() =>
														navigate(`${t.path}`)
													}
													data-testid={`engineLayout-${t.name}-tab`}
												>
													{t.name}
												</TabsTrigger>
											))}
										</TabsList>
									</div>
								</Tabs>
							</div>
						)}
						<div className="w-full bg-(--card) p-4">
							<Outlet />
						</div>
					</div>
				</div>
			) : (
				<Outlet />
			)}
		</EngineContext.Provider>
	);
};
