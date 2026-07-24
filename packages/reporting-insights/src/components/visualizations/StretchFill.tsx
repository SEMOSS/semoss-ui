/**
 * StretchFill — makes ANY visualization fill its box, ignoring the element's
 * natural aspect ratio. Used by the shared "Size & Position → Stretch to fill"
 * option so even aspect-locked charts (pie, radar/polar, sunburst, bubble …)
 * expand edge-to-edge instead of centering with whitespace.
 *
 * How: the child is rendered into a fixed reference square and then scaled
 * non-uniformly (scaleX/scaleY) to exactly cover the measured box. Because it's a
 * pure visual transform of the rendered output, it works for every chart type —
 * SVG, canvas, or Recharts — without per-chart plumbing. A round chart becomes an
 * oval that fills; that's the intended, opt-in behaviour.
 */
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

const REF = 600; // reference square the child renders into before scaling

export function StretchFill({ children }: { children: ReactNode }) {
	const outerRef = useRef<HTMLDivElement>(null);
	const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

	useLayoutEffect(() => {
		const el = outerRef.current;
		if (!el) return;
		const measure = () =>
			setDims({ w: el.clientWidth, h: el.clientHeight });
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const sx = dims.w ? dims.w / REF : 1;
	const sy = dims.h ? dims.h / REF : 1;

	return (
		<div
			ref={outerRef}
			style={{
				width: "100%",
				height: "100%",
				overflow: "hidden",
				position: "relative",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: REF,
					height: REF,
					transform: `scale(${sx}, ${sy})`,
					transformOrigin: "top left",
				}}
			>
				{children}
			</div>
		</div>
	);
}
