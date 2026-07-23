import { useMemo } from "react";
import {
	matchPath,
	Outlet,
	useLocation,
	useParams,
	useResolvedPath,
} from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Spinner, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { EngineHeader } from "@/components/engine";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
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
	const getEngineMetadata = usePixel<Engine>(
		engineId
			? `GetEngineMetadata(engine=["${engineId}"], metaKeys=${JSON.stringify(
					[metaKeys],
				)}); `
			: "",
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

	// get the user's role
	const getUserEnginePermission = useAPI(
		engineId ? ["getUserEnginePermission", engineId] : null,
		{
			data: undefined,
		},
	);

	// get the tabs based on permission and database type
	const tabs = useMemo(() => {
		// must be valid
		if (!route) {
			return [];
		}

		// for discoverable users only show unrestricted tabs (Overview)
		if (getUserEnginePermission.data === "DISCOVERABLE") {
			return route.specific.filter((t) => !t.restrict);
		}

		if (
			getUserEnginePermission.status !== "SUCCESS" ||
			!getUserEnginePermission.data
		) {
			return [];
		}

		// check the permission
		const permission = getUserEnginePermission.data;

		// get the routes based on permission
		let filteredTabs = route.specific.filter(
			(t) => t.restrict.indexOf(permission) > -1,
		);

		// additional filtering for DATABASE type engines - hide Query/SPARQL tabs based on category
		if (route.type === "DATABASE") {
			const databaseCategory = getDatabaseCategory.data;
			filteredTabs = filteredTabs.filter((t) => {
				if (t.path === "query") {
					return databaseCategory === "SQL";
				}
				if (t.path === "sparql-query") {
					return databaseCategory === "RDF";
				}
				return true;
			});
		}

		return filteredTabs;
	}, [
		route,
		getUserEnginePermission.status,
		getUserEnginePermission.data,
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

	// whether we're on the edit route for this engine
	const isEdit = Boolean(
		matchPath(`${resolvedPath.pathname}/edit`, pathname),
	);

	// if the engine ID is missing, navigate to the list
	if (!engineId) {
		return <ResourceNotFound path={route.path} />;
	}

	if (
		getUserEnginePermission.status === "ERROR" ||
		getEngineMetadata.status === "ERROR"
	) {
		return <ResourceNotFound path={route.path} />;
	}

	if (
		getUserEnginePermission.status !== "SUCCESS" ||
		!getUserEnginePermission.data ||
		getEngineMetadata.status !== "SUCCESS" ||
		getDatabaseCategory.status !== "SUCCESS"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<EngineContext.Provider
			value={{
				type: route.type,
				path: route.path,
				name: route.name,
				engine: getEngineMetadata.data,
				permission: getUserEnginePermission.data,
				refresh: getEngineMetadata.refresh,
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
