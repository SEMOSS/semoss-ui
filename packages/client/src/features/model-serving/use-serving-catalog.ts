import { usePixel } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import {
	buildServingCatalogPixel,
	parseServingCatalog,
	type ServingCatalog,
} from "@/api/model-serving";

/** What `useServingCatalog` gives its page */
export interface ServingCatalogResult {
	catalog: ServingCatalog | null;
	error: string | null;
	isLoading: boolean;
	refresh: () => void;
}

/** The models admins approved for serving, read once and on refresh. */
export function useServingCatalog(): ServingCatalogResult {
	const result = usePixel<unknown>(buildServingCatalogPixel(), {
		data: null,
	});
	let catalog: ServingCatalog | null = null;
	let error = result.error?.message ?? null;
	if (result.status === "SUCCESS") {
		try {
			catalog = parseServingCatalog(result.data);
		} catch (cause: unknown) {
			error = getErrorMessage(cause, "The catalog could not be read.");
		}
	}
	return {
		catalog,
		error,
		isLoading: result.status === "INITIAL" || result.status === "LOADING",
		refresh: result.refresh,
	};
}
