import { useMemo } from "react";
import {
	matchPath,
	Outlet,
	useLocation,
	useParams,
	useResolvedPath,
} from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Engine, Role } from "@semoss/shared";
import { Spinner, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { EngineHeader } from "@/components/engine";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

interface EngineLayoutProps {
	name: string;
	path: string;
	type: Engine["engine_type"];
	tabs: {
		/** Name of the specific page */
		name: string;

		/** Path of the specific page */
		path: string;

		/** Restrict to certain roles */
		restrict: Role[];
	}[];
}

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineLayout: React.FC<EngineLayoutProps> = ({
	name,
	path,
	type,
	tabs,
}) => {
	const route = { name, path, type };
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

	// get the user's role
	const getUserEnginePermission = useAPI(
		engineId ? ["getUserEnginePermission", engineId] : null,
		{
			data: undefined,
		},
	);

	// get the visible tabs based on permission
	const visibleTabs = useMemo(() => {
		// get the routes based on permission
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!getUserEnginePermission.data) {
				return false;
			}
			return tab.restrict.includes(getUserEnginePermission.data);
		});
	}, [tabs, getUserEnginePermission.data]);

	/**
	 * Gets active tab
	 * @returns index of selectedTab
	 */
	const activeTabIdx: number = useMemo(() => {
		for (
			let tabIdx = 0, tabLen = visibleTabs.length;
			tabIdx < tabLen;
			tabIdx++
		) {
			if (
				matchPath(
					`${resolvedPath.pathname}/${visibleTabs[tabIdx].path}`,
					pathname,
				)
			) {
				return tabIdx;
			}
		}

		return -1;
	}, [visibleTabs, resolvedPath, pathname]);

	// if the engine ID is missing, navigate to the list
	if (!engineId) {
		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<ResourceNotFound path={route.path} />
			</>
		);
	}

	if (
		getUserEnginePermission.status === "ERROR" ||
		getEngineMetadata.status === "ERROR"
	) {
		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<ResourceNotFound path={route.path} />
			</>
		);
	}

	if (
		getUserEnginePermission.status !== "SUCCESS" ||
		!getUserEnginePermission.data ||
		getEngineMetadata.status !== "SUCCESS"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
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
				<div className="flex flex-col gap-4">
					<EngineHeader />
					<div className="flex flex-col rounded-lg bg-(--muted)">
						{visibleTabs.length > 0 && (
							<div>
								<Tabs
									value={
										activeTabIdx !== -1
											? visibleTabs[activeTabIdx].path
											: undefined
									}
									className="gap-0 bg-transparent"
								>
									<div className="w-full overflow-x-auto md:w-[80%]">
										<TabsList className="w-max flex-nowrap gap-2">
											{visibleTabs.map((t) => (
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
			</EngineContext.Provider>
		</>
	);
};
