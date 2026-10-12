import { usePixel } from "@semoss/sdk/react";
import { readNonBlankString } from "@semoss/utility/text";

/**
 * Reads the name of an app or engine through the admin info pixels, for the
 * admin mode views opened from Settings, which have no app or engine context.
 *
 * @param kind - an app or an engine
 * @param id - its id, or empty to read nothing
 * @returns its display name, its name, or the id until either loads
 */
export const useAdminResourceName = (
	kind: "PROJECT" | "ENGINE",
	id: string,
): string => {
	const info = usePixel<Record<string, unknown>>(
		id
			? kind === "PROJECT"
				? `AdminProjectInfo(project=${JSON.stringify(id)});`
				: `AdminEngineInfo(engine=${JSON.stringify(id)});`
			: "",
		{ data: {} },
	);
	const data = info.data ?? {};
	const name =
		kind === "PROJECT"
			? (readNonBlankString(data.project_display_name) ??
				readNonBlankString(data.project_name))
			: (readNonBlankString(data.engine_display_name) ??
				readNonBlankString(data.engine_name));
	return name ?? id;
};
