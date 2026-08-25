import { Outlet, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";

interface EngineLayoutProps {
	/** Catalog information */
	catalog: {
		/** Name of the engine */
		name: string;

		/** Path to the catalog */
		path: string;
	};
}

const DEDICATED_ENGINE_META_KEYS = new Set(["description", "markdown", "tags"]);

export const getEngineOverviewMetaKeys = (
	configuredMetaKeys: { metakey: string }[],
): string[] => [
	"markdown",
	"description",
	...configuredMetaKeys
		.filter((metaKey) => !DEDICATED_ENGINE_META_KEYS.has(metaKey.metakey))
		.map((metaKey) => metaKey.metakey),
];

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineLayout: React.FC<EngineLayoutProps> = ({ catalog }) => {
	const { engineId } = useParams();
	const { configStore } = useRootStore();

	// Always request dedicated overview fields, including the catalog description.
	const metaKeys = getEngineOverviewMetaKeys(
		configStore.store.config.databaseMetaKeys,
	);

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

	if (
		!engineId ||
		getUserEnginePermission.status === "ERROR" ||
		getEngineMetadata.status === "ERROR"
	) {
		return <ResourceNotFound path={catalog.path} />;
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
		<EngineContext.Provider
			value={{
				type: getEngineMetadata.data.engine_type,
				catalog: catalog,
				engine: getEngineMetadata.data,
				permission: getUserEnginePermission.data,
				refresh: getEngineMetadata.refresh,
			}}
		>
			<Outlet />
		</EngineContext.Provider>
	);
};
