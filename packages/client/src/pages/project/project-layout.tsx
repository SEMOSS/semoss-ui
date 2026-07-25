import { useCallback, useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Project, ProjectDependency } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { ProjectContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";

export const DETAIL_CONFIG = {
	CODE: {
		name: "App",
		basePath: "/app",
	},
	SKILL: {
		name: "Skill",
		basePath: "/skill",
	},
	WORKSPACE: {
		name: "Agent",
		basePath: "/agent",
	},
} as const;

interface ProjectLayoutProps {
	/** Type of the route */
	type: Project["project_type"];
}

/**
 * Wrap the project routes and provide the ProjectContext + permission gate
 */
export const ProjectLayout = ({ type }: ProjectLayoutProps) => {
	const config = DETAIL_CONFIG[type as keyof typeof DETAIL_CONFIG];
	const catalog = useMemo(
		() => ({ name: config.name, path: config.basePath }),
		[config.name, config.basePath],
	);
	const { appId } = useParams();

	const { configStore } = useRootStore();

	// get a user's permission
	const getUserProjectPermission = useAPI(
		appId ? ["getUserProjectPermission", appId] : null,
		{
			data: undefined,
		},
	);

	// get dependencies for the project
	const getDependencies = usePixel<{
		engines: ProjectDependency[];
		dependencies: string[];
	}>(appId ? `GetProjectDependencies(project=["${appId}"]);` : "");

	// the core metadata keys plus any dynamic ones from the project config
	const metaKeys = useMemo(() => {
		const dynamicKeys = configStore.store.config.projectMetaKeys
			.map((k) => k.metakey)
			.filter(
				(key) =>
					key !== "description" &&
					key !== "markdown" &&
					key !== "tag" &&
					key !== "tags",
			);
		return ["description", "markdown", "tag", ...dynamicKeys];
	}, [configStore.store.config.projectMetaKeys]);

	// get the metadata for the project
	const getMetadata = usePixel<Project>(
		appId
			? `GetProjectMetadata(project=["${appId}"], metaKeys=${JSON.stringify(metaKeys)});`
			: "",
	);

	/**
	 * Refresh the project data
	 */
	const refresh = useCallback(() => {
		getDependencies.refresh();
		getUserProjectPermission.refresh();
		getMetadata.refresh();
	}, [
		getDependencies.refresh,
		getUserProjectPermission.refresh,
		getMetadata.refresh,
	]);

	if (
		!appId ||
		getUserProjectPermission.status === "ERROR" ||
		getDependencies.status === "ERROR" ||
		getMetadata.status === "ERROR"
	) {
		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<ResourceNotFound path={catalog.path} />
			</>
		);
	}

	if (
		getUserProjectPermission.status !== "SUCCESS" ||
		!getUserProjectPermission.data ||
		getDependencies.status !== "SUCCESS" ||
		getMetadata.status !== "SUCCESS"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<ProjectContext.Provider
			value={{
				type,
				catalog,
				project: getMetadata.data,
				permission: getUserProjectPermission.data,
				dependencies: getDependencies.data?.engines || [],
				refresh,
			}}
		>
			<Outlet />
		</ProjectContext.Provider>
	);
};
