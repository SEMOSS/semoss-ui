import { type SyntheticEvent, useMemo } from "react";
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
import { LoadingScreen, Stack, styled, ToggleTabsGroup } from "@semoss/ui";
import { EngineHeader } from "@/components/engine";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore, useSettings } from "@/hooks";
import type { ENGINE_ROUTES } from "./engine.constants";

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	alignItems: "center",
	padding: "0px 3px",
	height: "42px",
	width: "100%",
	borderTopLeftRadius: theme.shape.borderRadiusLg,
	borderTopRightRadius: theme.shape.borderRadiusLg,
	borderBottomRightRadius: 0,
	borderBottomLeftRadius: 0,
	background: theme.palette.primary.selected,
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
		borderRadius: "12px",
	},
}));

const StyledContent = styled("div")(({ theme }) => ({
	width: "100%",
	padding: theme.spacing(2),
	background: theme.palette.background.paper,
}));

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
		return <LoadingScreen.Trigger description="Checking Access" />;
	}

	// show a loading screen when it is pending
	if (getEngineMetadata.status !== "SUCCESS") {
		return <LoadingScreen.Trigger description="Opening Engine" />;
	}

	// show a loading screen when checking database category for DATABASE engines
	if (route.type === "DATABASE" && getDatabaseCategory.status !== "SUCCESS") {
		return <LoadingScreen.Trigger description="Loading Database Info" />;
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
			<Stack direction="column" spacing={2}>
				<EngineHeader />
				<Stack direction="column" spacing={0}>
					{tabs.length > 0 && (
						<StyledToggleTabsGroup
							boxSx={{
								width: "100%",
							}}
							value={activeTabIdx}
							onChange={(_e: SyntheticEvent, idx: number) => {
								// get the specific route
								const r = tabs[idx];

								// navigate to it
								navigate(`${r.path}`);
							}}
						>
							{tabs.map((t, _tIdx) => {
								return (
									<StyledToggleTabsGroupItem
										key={t.path}
										label={t.name}
										data-testid={`engineLayout-${t.name}-tab`}
									/>
								);
							})}
						</StyledToggleTabsGroup>
					)}
					<StyledContent>
						<Outlet />
					</StyledContent>
				</Stack>
			</Stack>
		</EngineContext.Provider>
	);
};
