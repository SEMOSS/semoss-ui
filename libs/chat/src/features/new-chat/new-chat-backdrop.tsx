import { useTheme } from "@semoss/ui/next";

/** Props for {@link NewChatBackdrop}. */
interface NewChatBackdropProps {
	/** The image behind a new chat in light mode. Empty for none. */
	src: string;
	/** The image in dark mode; empty for none. Default: `src`. */
	darkSrc?: string;
}

/**
 * An image filling the space behind a new chat's landing (`NewChat`'s
 * `backdrop`), for the color mode in use. Renders nothing without one.
 */
export const NewChatBackdrop = ({ src, darkSrc }: NewChatBackdropProps) => {
	const { theme: colorMode } = useTheme();
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	const shown = isDark ? (darkSrc ?? src) : src;
	if (!shown) return null;
	return (
		<img
			src={shown}
			alt=""
			className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
		/>
	);
};
