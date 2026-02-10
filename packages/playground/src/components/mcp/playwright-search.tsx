import { useEffect } from "react";
import { usePixel } from "@semoss/sdk/react";

interface PlaywrightScript {
	name: string;
	path: string;
	description?: string;
}

interface UsePlaywrightScriptsOptions {
	/** Project ID to query scripts for */
	projectId: string;
	/** Whether to enable the query */
	enabled?: boolean;
	/** Callback when scripts are loaded */
	onScriptsLoaded?: (scripts: PlaywrightScript[]) => void;
}

/**
 * Hook to fetch playwright scripts for a project using ListPlaywrightScripts reactor
 */
export const usePlaywrightScripts = ({
	projectId,
	enabled = true,
	onScriptsLoaded,
}: UsePlaywrightScriptsOptions) => {
	const getPlaywrightScripts = usePixel<PlaywrightScript[]>(
		projectId && enabled
			? `ListPlaywrightScripts(project=["${projectId}"]);`
			: "",
		{
			data: [],
		},
	);

	useEffect(() => {
		if (
			getPlaywrightScripts.status === "SUCCESS" &&
			getPlaywrightScripts.data.length > 0
		) {
			onScriptsLoaded?.(getPlaywrightScripts.data);
		}
	}, [getPlaywrightScripts.status, getPlaywrightScripts.data, onScriptsLoaded]);

	return {
		scripts: getPlaywrightScripts.data,
		isLoading:
			getPlaywrightScripts.status === "INITIAL" ||
			getPlaywrightScripts.status === "LOADING",
		isSuccess: getPlaywrightScripts.status === "SUCCESS",
		isError: getPlaywrightScripts.status === "ERROR",
		status: getPlaywrightScripts.status,
	};
};
