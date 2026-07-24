import { useEffect } from "react";

const STYLE_ID = "viz-tab-colors";

type VizColorInfo = { id: string; tabColor?: string; phi?: boolean };

function hexToRgb(hex: string): [number, number, number] | null {
	const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	return m
		? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
		: null;
}

function relativeLuminance(r: number, g: number, b: number): number {
	return [r, g, b].reduce((acc, v, i) => {
		const s = v / 255;
		const linear = s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
		return acc + linear * [0.2126, 0.7152, 0.0722][i];
	}, 0);
}

function darkenHex(hex: string, amount: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;
	const [r, g, b] = rgb.map((v) => Math.max(0, Math.floor(v * (1 - amount))));
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Injects / updates a <style> tag that colors FlexLayout tab buttons for each
 * visualization that has a tabColor hex string set (and isn't a PHI tab).
 * Text and accent colors are derived from the chosen hex for readability.
 */
export function useTabColors(visualizations: VizColorInfo[]) {
	const colorKey = visualizations
		.map((v) => `${v.id}:${v.tabColor ?? ""}:${!!v.phi}`)
		.join(",");

	useEffect(() => {
		let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = STYLE_ID;
			document.head.appendChild(el);
		}

		const rules = visualizations
			.filter(
				(v) =>
					v.tabColor &&
					!v.phi &&
					/^#[0-9A-Fa-f]{6}$/.test(v.tabColor),
			)
			.flatMap((v) => {
				const hex = v.tabColor!;
				const rgb = hexToRgb(hex);
				const lum = rgb ? relativeLuminance(...rgb) : 0.5;
				// Readable text: dark on light backgrounds, light on dark backgrounds.
				const textColor = lum > 0.5 ? "#1c1917" : "#fafaf9";
				// Selected tab reads as "active" while staying fully colored.
				const selectedBg = darkenHex(hex, 0.14);
				const sel = `[data-tab-id="${v.id}"]`;
				return [
					// Fill the ENTIRE tab (idle + selected) with the color — no white
					// selected state, no top-only accent bar.
					`.flexlayout__tab_button:has(${sel}),.flexlayout__tab_button_top:has(${sel})` +
						`{background-color:${hex}!important;box-shadow:none!important;}`,
					// Force the label + icon (rendered in child nodes) to the readable color.
					`.flexlayout__tab_button:has(${sel}),.flexlayout__tab_button:has(${sel}) *,` +
						`.flexlayout__tab_button_top:has(${sel}),.flexlayout__tab_button_top:has(${sel}) *` +
						`{color:${textColor}!important;fill:${textColor}!important;}`,
					// Selected: slightly darker shade of the same color so it's distinguishable.
					`.flexlayout__tab_button--selected:has(${sel}),` +
						`.flexlayout__tab_button_top.flexlayout__tab_button--selected:has(${sel})` +
						`{background-color:${selectedBg}!important;}`,
				];
			})
			.join("\n");

		el.textContent = rules;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [colorKey]);
}
