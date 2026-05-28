import { useCallback, useRef } from "react";

interface ResizableOptions {
	direction: "horizontal" | "vertical";
	onResize: (percent: number) => void;
	min?: number;
	max?: number;
}

/**
 * Returns a callback ref to attach to a drag handle. The listeners are
 * (re)wired whenever React mounts a different DOM node into the ref, so the
 * handle works even when it's rendered behind a conditional. Percentages are
 * measured relative to the handle's `offsetParent`.
 */
export const useResizableHandle = ({
	direction,
	onResize,
	min = 10,
	max = 90,
}: ResizableOptions) => {
	const teardownRef = useRef<(() => void) | null>(null);
	const optsRef = useRef({ direction, onResize, min, max });
	optsRef.current = { direction, onResize, min, max };

	return useCallback((el: HTMLDivElement | null) => {
		// detach any previous listeners
		teardownRef.current?.();
		teardownRef.current = null;
		if (!el) return;

		let active = false;

		const onMove = (e: MouseEvent) => {
			if (!active) return;
			const parent = el.offsetParent as HTMLElement | null;
			if (!parent) return;
			const rect = parent.getBoundingClientRect();
			const { direction, onResize, min, max } = optsRef.current;

			let percent: number;
			if (direction === "horizontal") {
				percent = ((e.clientX - rect.left) / rect.width) * 100;
			} else {
				percent = ((e.clientY - rect.top) / rect.height) * 100;
			}
			if (percent < min) percent = min;
			if (percent > max) percent = max;
			onResize(percent);
		};

		const onUp = () => {
			active = false;
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};

		const onDown = (e: MouseEvent) => {
			e.preventDefault();
			active = true;
			document.body.style.cursor =
				optsRef.current.direction === "horizontal"
					? "ew-resize"
					: "ns-resize";
			document.body.style.userSelect = "none";
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
		};

		el.addEventListener("mousedown", onDown);
		teardownRef.current = () => {
			el.removeEventListener("mousedown", onDown);
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, []);
};
