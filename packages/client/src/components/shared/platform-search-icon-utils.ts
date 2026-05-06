import BRAIN from "@/assets/img/BRAIN.png";
import { ENGINE_IMAGES } from "@/shared/constants/engine-images.constants";

const hashString = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
};

const normalizeEngineKey = (value?: string) =>
	(value || "")
		.trim()
		.replace(/[^A-Za-z0-9]+/g, "_")
		.toUpperCase();

export const buildInitials = (label: string): string => {
	const tokens = label.split(/[^A-Za-z0-9]+/).filter((token) => token.length);
	return tokens
		.map((token) => token[0].toUpperCase())
		.slice(0, 3)
		.join("");
};

export const getAppCatalogAvatarStyle = (label: string) => {
	const base = hashString(label || "App") % 360;
	return {
		backgroundColor: `hsl(${base}, 22%, 72%)`,
		color: `hsl(${base}, 28%, 28%)`,
	};
};

export const getEngineSubtypeIcon = (
	engineType: string,
	engineSubtype?: string,
) => {
	const typeKey = normalizeEngineKey(engineType);
	const subtypeKeyRaw = normalizeEngineKey(engineSubtype);
	const subtypeKey =
		subtypeKeyRaw === "GUANACO" ? "HUGGINGFACE" : subtypeKeyRaw;
	const imageOptions = ENGINE_IMAGES[typeKey] || [];

	const match = imageOptions.find(
		(option) => normalizeEngineKey(option.name) === subtypeKey,
	);

	return match?.icon || BRAIN;
};
