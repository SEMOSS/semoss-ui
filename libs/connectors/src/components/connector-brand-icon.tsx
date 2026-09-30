import type { ReactNode } from "react";

/** A Microsoft 365 or Google Workspace app with a logo of its own. */
export type ConnectorBrand =
	| "outlook"
	| "outlook-calendar"
	| "onedrive"
	| "teams"
	| "gmail"
	| "google-calendar"
	| "google-drive"
	| "google-docs";

/** A logo's drawing and the box it is drawn in. */
interface BrandGlyph {
	viewBox: string;
	paths: ReactNode;
}

/**
 * The apps' logos, drawn inline so they need no request and scale with the
 * surrounding text. The colors are the brands' own, not theme tokens.
 */
const BRAND_GLYPHS: Record<ConnectorBrand, BrandGlyph> = {
	outlook: {
		viewBox: "0 0 24 24",
		paths: (
			<>
				<rect
					x="8"
					y="4"
					width="14"
					height="16"
					rx="2"
					fill="#28A8EA"
				/>
				<path
					d="M8 11l7 4.5 7-4.5v7a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z"
					fill="#0078D4"
				/>
				<rect
					x="2"
					y="6.5"
					width="11"
					height="11"
					rx="1.5"
					fill="#0364B8"
				/>
				<ellipse
					cx="7.5"
					cy="12"
					rx="2.4"
					ry="2.9"
					fill="none"
					stroke="#FFFFFF"
					strokeWidth="1.6"
				/>
			</>
		),
	},
	"outlook-calendar": {
		viewBox: "0 0 24 24",
		paths: (
			<>
				<rect
					x="3"
					y="4"
					width="18"
					height="17"
					rx="2.5"
					fill="#0078D4"
				/>
				<path
					d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5V9H3V6.5A2.5 2.5 0 0 1 5.5 4z"
					fill="#0364B8"
				/>
				<rect x="7" y="2" width="2" height="4" rx="1" fill="#0364B8" />
				<rect x="15" y="2" width="2" height="4" rx="1" fill="#0364B8" />
				<rect
					x="6"
					y="11.5"
					width="3"
					height="2.5"
					rx="0.5"
					fill="#FFFFFF"
				/>
				<rect
					x="10.5"
					y="11.5"
					width="3"
					height="2.5"
					rx="0.5"
					fill="#FFFFFF"
				/>
				<rect
					x="15"
					y="11.5"
					width="3"
					height="2.5"
					rx="0.5"
					fill="#FFFFFF"
				/>
				<rect
					x="6"
					y="15.5"
					width="3"
					height="2.5"
					rx="0.5"
					fill="#FFFFFF"
				/>
				<rect
					x="10.5"
					y="15.5"
					width="3"
					height="2.5"
					rx="0.5"
					fill="#FFFFFF"
				/>
			</>
		),
	},
	onedrive: {
		viewBox: "0 0 24 24",
		paths: (
			<>
				<path
					d="M14.5 6.5a5.5 5.5 0 0 1 5.2 3.8A4.2 4.2 0 0 1 19 18.5h-8.5l-1.3-8.8A5.5 5.5 0 0 1 14.5 6.5z"
					fill="#0364B8"
				/>
				<path
					d="M8 9.5a4.8 4.8 0 0 1 4.4 2.9A3.5 3.5 0 0 1 14.8 18.5H5.5a3.8 3.8 0 0 1-.6-7.6A4.8 4.8 0 0 1 8 9.5z"
					fill="#28A8EA"
				/>
				<path
					d="M12.4 12.4a3.5 3.5 0 0 1 2.4 6.1H19a4.2 4.2 0 0 0 .7-8.2 5.5 5.5 0 0 0-7.3 2.1z"
					fill="#1490DF"
				/>
			</>
		),
	},
	teams: {
		viewBox: "0 0 24 24",
		paths: (
			<>
				<circle cx="18" cy="6.5" r="2.3" fill="#5059C9" />
				<path
					d="M15.5 10H21a1 1 0 0 1 1 1v4.8a3.3 3.3 0 0 1-3.3 3.3 3.3 3.3 0 0 1-3.2-3.3z"
					fill="#5059C9"
				/>
				<circle cx="11.5" cy="5.5" r="3" fill="#7B83EB" />
				<path
					d="M7 9.5h9a1 1 0 0 1 1 1v5.8a5 5 0 0 1-10 0z"
					fill="#7B83EB"
				/>
				<rect
					x="2"
					y="7.5"
					width="10"
					height="10"
					rx="1.5"
					fill="#4B53BC"
				/>
				<path d="M4.5 10h5v1.4H7.7v4.4H6.3v-4.4H4.5z" fill="#FFFFFF" />
			</>
		),
	},
	gmail: {
		viewBox: "0 0 48 48",
		paths: (
			<>
				<path
					d="M45 16.2l-5 2.75-5 4.75V40h7a3 3 0 0 0 3-3z"
					fill="#4CAF50"
				/>
				<path
					d="M3 16.2l3.6 1.7L13 23.7V40H6a3 3 0 0 1-3-3z"
					fill="#1E88E5"
				/>
				<path
					d="M35 11.2l-11 8.25-11-8.25-1 5.8 1 6.7 11 8.25 11-8.25 1-6.7z"
					fill="#E53935"
				/>
				<path
					d="M3 12.3v3.9l10 7.5V11.2L9.9 8.86A4.3 4.3 0 0 0 3 12.3z"
					fill="#C62828"
				/>
				<path
					d="M45 12.3v3.9l-10 7.5V11.2l3.1-2.34A4.3 4.3 0 0 1 45 12.3z"
					fill="#FBC02D"
				/>
			</>
		),
	},
	"google-calendar": {
		viewBox: "0 0 24 24",
		paths: (
			<>
				<rect
					x="3"
					y="3"
					width="18"
					height="18"
					rx="2.5"
					fill="#4285F4"
				/>
				<path
					d="M17 3h1.5A2.5 2.5 0 0 1 21 5.5V17h-4z"
					fill="#FBBC04"
				/>
				<path d="M3 17h14v4H5.5A2.5 2.5 0 0 1 3 18.5z" fill="#34A853" />
				<path d="M17 17h4l-4 4z" fill="#EA4335" />
				<rect
					x="6.5"
					y="6.5"
					width="10.5"
					height="10.5"
					fill="#FFFFFF"
				/>
				<path
					d="M9 10h5.5M9 12.5h5.5M9 15h3.5"
					stroke="#4285F4"
					strokeWidth="1.3"
					strokeLinecap="round"
				/>
			</>
		),
	},
	"google-drive": {
		viewBox: "0 0 87.3 78",
		paths: (
			<>
				<path
					d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
					fill="#0066DA"
				/>
				<path
					d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z"
					fill="#00AC47"
				/>
				<path
					d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z"
					fill="#EA4335"
				/>
				<path
					d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"
					fill="#00832D"
				/>
				<path
					d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
					fill="#2684FC"
				/>
				<path
					d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z"
					fill="#FFBA00"
				/>
			</>
		),
	},
	"google-docs": {
		viewBox: "0 0 24 24",
		paths: (
			<>
				<path
					d="M6.5 2H14l6 6v12.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2z"
					fill="#4285F4"
				/>
				<path d="M14 2v4.5A1.5 1.5 0 0 0 15.5 8H20z" fill="#A1C2FA" />
				<path
					d="M8.5 12h7M8.5 14.5h7M8.5 17h4.5"
					stroke="#FFFFFF"
					strokeWidth="1.3"
					strokeLinecap="round"
				/>
			</>
		),
	},
};

/** Props for {@link ConnectorBrandIcon}. */
export interface ConnectorBrandIconProps {
	/** The app whose logo to draw. */
	brand: ConnectorBrand;
	/** Classes for the icon, such as its size. */
	className?: string;
}

/**
 * The logo of a Microsoft 365 or Google Workspace app, in its own colors.
 * Decorative: the app's name is always written next to it.
 */
export const ConnectorBrandIcon = ({
	brand,
	className,
}: ConnectorBrandIconProps) => {
	const glyph = BRAND_GLYPHS[brand];
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: decorative, hidden from assistive tech; the app's name is written beside it
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={glyph.viewBox}
			aria-hidden
			focusable="false"
			className={className}
		>
			{glyph.paths}
		</svg>
	);
};
