import type { CSSProperties } from "react";

interface TagColorPalette {
	backgroundColor: string;
	color: string;
	borderColor: string;
}

const FALLBACK_TAG_PALETTE: TagColorPalette = {
	backgroundColor: "var(--color-background-secondary)",
	color: "var(--color-text-secondary)",
	borderColor: "var(--color-border-tertiary)",
};

const tagPaletteCache = new Map<string, TagColorPalette>();

export const normalizeTagArray = (tag?: string[] | string): string[] => {
	if (tag === undefined) return [];
	if (Array.isArray(tag)) return tag.filter(Boolean);
	return tag !== "" ? [tag] : [];
};

const normalizeTagKey = (tag: string): string => {
	return tag.trim().toLowerCase().replace(/\s+/g, " ");
};

const hashTag = (value: string): number => {
	let hash = 0;

	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}

	return Math.abs(hash);
};

const createTagPalette = (tag: string): TagColorPalette => {
	const hash = hashTag(tag);
	const hue = hash % 360;
	const saturation = 44 + (hash % 24);
	const textSaturation = Math.max(32, saturation - 12);
	const backgroundLightness = 90 + ((hash >> 8) % 6);
	const borderLightness = 74 + ((hash >> 14) % 10);
	const textLightness = 22 + ((hash >> 20) % 10);

	return {
		backgroundColor: `hsl(${hue} ${saturation}% ${backgroundLightness}%)`,
		color: `hsl(${hue} ${textSaturation}% ${textLightness}%)`,
		borderColor: `hsl(${hue} ${textSaturation}% ${borderLightness}%)`,
	};
};

export const getTagColorPalette = (tag: string): TagColorPalette => {
	const normalizedTag = normalizeTagKey(tag);
	if (!normalizedTag) {
		return FALLBACK_TAG_PALETTE;
	}

	const cachedPalette = tagPaletteCache.get(normalizedTag);
	if (cachedPalette) {
		return cachedPalette;
	}

	const palette = createTagPalette(normalizedTag);
	tagPaletteCache.set(normalizedTag, palette);

	return palette;
};

export const getTagBadgeStyle = (tag: string): CSSProperties => {
	const palette = getTagColorPalette(tag);

	return {
		backgroundColor: palette.backgroundColor,
		color: palette.color,
		border: `1px solid ${palette.borderColor}`,
	};
};
