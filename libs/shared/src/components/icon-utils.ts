import { hashString } from "@semoss/utility/text";
import {
	ENGINE_ICON_FALLBACK_FILE,
	ENGINE_IMAGES,
	loadEngineIcon,
} from "../constants/engine-images.constants";

export { buildInitials } from "@semoss/utility/text";

const normalizeEngineKey = (value?: string) =>
	(value || "")
		.trim()
		.replace(/[^A-Za-z0-9]+/g, "_")
		.toUpperCase();

export const getAppCatalogAvatarStyle = (label: string) => {
	const base = hashString(label || "App") % 360;
	return {
		backgroundColor: `hsl(${base}, 22%, 72%)`,
		color: `hsl(${base}, 28%, 28%)`,
	};
};

export const getEngineSubtypeIcon = async (
	engineType: string,
	engineSubtype?: string,
): Promise<string | null> => {
	const typeKey = normalizeEngineKey(engineType);
	const subtypeKeyRaw = normalizeEngineKey(engineSubtype);
	const subtypeKey =
		subtypeKeyRaw === "GUANACO" ? "HUGGINGFACE" : subtypeKeyRaw;
	const imageOptions = ENGINE_IMAGES[typeKey] || [];

	const match = imageOptions.find(
		(option) => normalizeEngineKey(option.name) === subtypeKey,
	);

	if (match) {
		const resolved = await loadEngineIcon(match.icon);
		if (resolved) return resolved;
	}

	return loadEngineIcon(ENGINE_ICON_FALLBACK_FILE);
};
