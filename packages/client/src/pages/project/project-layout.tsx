import { useCallback, useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Project, ProjectDependency } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { ProjectContext, type ProjectContextType } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";

export const CATALOG: Record<
	Project["project_type"],
	ProjectContextType["catalog"]
> = {
	CODE: { name: "App", path: "/app" },
	BLOCKS: { name: "App", path: "/app" },
	SKILL: { name: "Skill", path: "/skill" },
	WORKSPACE: { name: "Agent", path: "/agent" },
	NOTEBOOK: { name: "Notebook", path: "/notebook" },
	AUTOMATION: { name: "Automation", path: "/automation" },
	INSIGHT: { name: "App", path: "/app" },
} as const;

/**
 * Wrap the project routes and provide the ProjectContext + permission gate
 */
export const ProjectLayout = () => {
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

	/**
	 * Get the catalog data
	 */
	const catalog = useMemo(() => {
		return getMetadata.data?.project_type
			? CATALOG[getMetadata.data?.project_type]
			: { name: "", path: "/" };
	}, [getMetadata.data?.project_type]);

	if (
		!appId ||
		getUserProjectPermission.status === "ERROR" ||
		getDependencies.status === "ERROR" ||
		getMetadata.status === "ERROR"
	) {
		return <ResourceNotFound path={catalog.path} />;
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
				type: getMetadata.data.project_type,
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
