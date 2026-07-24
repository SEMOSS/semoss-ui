import { Outlet, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { EngineContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";

interface EngineLayoutProps {
	/** Type of the engine */
	type: Engine["engine_type"];

	/** Catalog information */
	catalog: {
		/** Name of the engine */
		name: string;

		/** Path to the catalog */
		path: string;
	};
}

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineLayout: React.FC<EngineLayoutProps> = ({
	type,
	catalog,
}) => {
	const { engineId } = useParams();
	const { configStore } = useRootStore();

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

	if (
		!engineId ||
		getUserEnginePermission.status === "ERROR" ||
		getEngineMetadata.status === "ERROR"
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
					type: type,
					catalog: catalog,
					engine: getEngineMetadata.data,
					permission: getUserEnginePermission.data,
					refresh: getEngineMetadata.refresh,
				}}
			>
				<Outlet />
			</EngineContext.Provider>
		</>
	);
};
