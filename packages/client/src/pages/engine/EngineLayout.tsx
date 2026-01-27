import { useMemo } from "react";
import {
	matchPath,
	Navigate,
	Outlet,
	useLocation,
	useNavigate,
	useParams,
	useResolvedPath,
} from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import { Spinner, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { EngineHeader } from "@/components/engine";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore, useSettings } from "@/hooks";
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
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { adminMode } = useSettings();

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
		database_name?: string;
		database_discoverable?: boolean;
		database_created_by?: string;
		database_date_created?: string;
		last_updated?: string;
		description?: string;
		database_type?: string;
		database_subtype?: string;
		DATEADDED?: string;
		PERMISSIONGRANTEDBY?: string;
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

	// convert the data into an object
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

	// get the user's role
	const getUserEnginePermission = useAPI(
		!adminMode && engineId ? ["getUserEnginePermission", engineId] : null,
	);

	// get the tabs based on permission and database type
	const tabs = useMemo(() => {
		// must be valid
		if (
			!route ||
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

		// additional filtering for DATABASE type engines - hide Query tab unless database is SQL
		if (route.type === "DATABASE") {
			const databaseCategory = getDatabaseCategory.data;
			filteredTabs = filteredTabs.filter((t) => {
				// if it's the Query tab (path === 'query'), only show it if database is SQL
				if (t.path === "query") {
					return databaseCategory === "SQL";
				}
				return true;
			});
		}

		return filteredTabs;
	}, [
		route,
		getUserEnginePermission.status,
		getUserEnginePermission.data
			? getUserEnginePermission.data.permission
			: "",
		getDatabaseCategory.data,
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

	// if the engine isn't found, navigate to the Home Page
	if (!engineId || getUserEnginePermission.status === "ERROR") {
		return <Navigate to={`${route.path}`} replace />;
	}

	// show a loading screen when it is pending
	if (getUserEnginePermission.status !== "SUCCESS") {
		return (
			<div>
				<Spinner className="size-8" />
				<p className="text-muted-foreground">Checking Access</p>
			</div>
		);
	}

	// show a loading screen when it is pending
	if (getEngineMetadata.status !== "SUCCESS") {
		return (
			<div>
				<Spinner className="size-8" />
				<p className="text-muted-foreground">Opening Engine</p>
			</div>
		);
	}

	// show a loading screen when checking database category for DATABASE engines
	if (route.type === "DATABASE" && getDatabaseCategory.status !== "SUCCESS") {
		return (
			<div>
				<Spinner className="size-8" />
				<p className="text-muted-foreground">Loading Database Info</p>
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
					role: getUserEnginePermission.data.permission,
					name:
						(getEngineMetadata.data?.database_name as string) || "",
					metadata: values,
					database_subtype: getEngineMetadata.data?.database_subtype,
					database_created_by:
						getEngineMetadata.data?.database_created_by,
					PERMISSIONGRANTEDBY:
						getEngineMetadata.data?.PERMISSIONGRANTEDBY,
					DATEADDED: getEngineMetadata.data?.DATEADDED,
					refresh: getEngineMetadata.refresh,
				},
			}}
		>
			<div className="flex flex-col gap-4">
				<EngineHeader />
				<div className="flex flex-col">
					{tabs.length > 0 && (
						<Tabs
							value={
								activeTabIdx !== -1
									? tabs[activeTabIdx].path
									: undefined
							}
						>
							<TabsList className="h-[42px] w-full rounded-t-[10px] rounded-b-none bg-(--secondary)">
								{tabs.map((t, idx) => (
									<TabsTrigger
										key={t.path}
										value={t.path}
										onClick={() => navigate(`${t.path}`)}
										data-testid={`engineLayout-${t.name}-tab`}
										className="h-[38px] flex-1 rounded-lg px-4 text-[14px]"
									>
										{t.name}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					)}
					<div className="w-full bg-(--card) p-4">
						<Outlet />
					</div>
				</div>
			</div>
		</EngineContext.Provider>
	);
};
