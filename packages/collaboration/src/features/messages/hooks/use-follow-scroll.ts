import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

interface FollowScrollOptions {
	/** Changing rooms resets the initial position if the shell is reused. */
	resetKey?: string;
	/** Start settled detail panes at their beginning. */
	initialFollow?: boolean;
	/** Increment when submitting a message to resume following immediately. */
	resumeSignal?: number;
}

interface FollowScroll {
	viewportRef: (element: HTMLElement | null) => void;
	contentRef: (element: HTMLElement | null) => void;
	isFollowing: boolean;
	hasMoreBelow: boolean;
	scrollToLatest: () => void;
}

/** Follow rendered growth, keeping all scrolling inside the owning viewport. */
export function useFollowScroll({
	resetKey = "",
	resumeSignal = 0,
	initialFollow = true,
}: FollowScrollOptions = {}): FollowScroll {
	const [viewport, setViewport] = useState<HTMLElement | null>(null);
	const [content, setContent] = useState<HTMLElement | null>(null);
	const [isFollowing, setIsFollowing] = useState(initialFollow);
	const [hasMoreBelow, setHasMoreBelow] = useState(false);
	const following = useRef(initialFollow);
	const roomKey = useRef(resetKey);
	const previousSignal = useRef(resumeSignal);
	const resume = useRef<(() => void) | null>(null);
	const reducedMotion = useReducedMotion();

	useLayoutEffect(() => {
		if (!viewport || !content) return;
		if (roomKey.current !== resetKey) {
			roomKey.current = resetKey;
			following.current = initialFollow;
			setIsFollowing(initialFollow);
		}
		let frame: number | null = null;
		let lastTop = viewport.scrollTop;
		let isSmooth = false;
		let lastTime = performance.now();
		let previousHeight = viewport.scrollHeight;
		let touchY: number | null = null;
		let anchors: { element: Element; top: number }[] = [];
		const updateMoreBelow = (): void => {
			setHasMoreBelow(
				viewport.scrollHeight -
					viewport.clientHeight -
					viewport.scrollTop >
					2,
			);
		};
		const isVisibleAnchor = (element: Element): boolean =>
			content.contains(element) &&
			!element.closest("[inert], [hidden]") &&
			element.getBoundingClientRect().height > 0;

		const rememberAnchor = (): void => {
			const top = viewport.getBoundingClientRect().top;
			const candidates = Array.from(
				content.querySelectorAll<HTMLElement>("[data-scroll-anchor]"),
			).filter(
				(candidate) =>
					isVisibleAnchor(candidate) &&
					candidate.getBoundingClientRect().bottom > top,
			);
			// Prefer the visible row inside an activity section, retaining its
			// section as a fallback if that row is folded into a summary.
			let part = candidates[0];
			for (const candidate of candidates) {
				if (part?.contains(candidate)) part = candidate;
			}
			// Retain the visible paragraph when opening a workbench reflows prose.
			const blocks = part?.querySelector(
				"[data-slot=markdown]",
			)?.children;
			const element =
				(blocks &&
					Array.from(blocks).find(
						(candidate) =>
							candidate.getBoundingClientRect().bottom > top,
					)) ??
				part;
			anchors = [];
			let candidate: Element | null | undefined = element;
			while (candidate && content.contains(candidate)) {
				anchors.push({
					element: candidate,
					top: candidate.getBoundingClientRect().top - top,
				});
				candidate = candidate.parentElement?.closest(
					"[data-scroll-anchor]",
				);
			}
		};
		const writeTop = (top: number): void => {
			viewport.scrollTop = top;
			lastTop = viewport.scrollTop;
			updateMoreBelow();
		};
		const update = (time: number): void => {
			frame = null;
			if (!following.current) {
				const anchor = anchors.find(({ element }) =>
					isVisibleAnchor(element),
				);
				if (anchor) {
					const nextTop =
						anchor.element.getBoundingClientRect().top -
						viewport.getBoundingClientRect().top;
					writeTop(viewport.scrollTop + nextTop - anchor.top);
				}
				rememberAnchor();
				updateMoreBelow();
				return;
			}
			const target = Math.max(
				0,
				viewport.scrollHeight - viewport.clientHeight,
			);
			const difference = target - viewport.scrollTop;
			if (isSmooth && Math.abs(difference) > 1) {
				const fraction =
					1 - Math.exp(-Math.max(1, time - lastTime) / 45);
				writeTop(viewport.scrollTop + difference * fraction);
				frame = requestAnimationFrame(update);
			} else {
				writeTop(target);
				isSmooth = false;
			}
			lastTime = time;
		};
		const schedule = (): void => {
			// Initial measurement and reading-anchor compensation are immediate.
			// Growth while following uses one loop with an updated target, never
			// a new browser smooth-scroll operation for every text chunk.
			if (
				following.current &&
				!reducedMotion &&
				previousHeight > viewport.clientHeight
			)
				isSmooth = true;
			previousHeight = viewport.scrollHeight;
			if (frame === null) {
				lastTime = performance.now();
				frame = requestAnimationFrame(update);
			}
		};
		const pause = (): void => {
			following.current = false;
			isSmooth = false;
			setIsFollowing(false);
			if (frame !== null) cancelAnimationFrame(frame);
			frame = null;
			rememberAnchor();
			updateMoreBelow();
		};
		const handleWheel = (event: WheelEvent): void => {
			if (event.deltaY < 0) pause();
		};
		const handleDisclosure = (event: MouseEvent): void => {
			if (!(event.target instanceof Element)) return;
			const trigger = event.target.closest(
				"button[aria-expanded], button[data-preserve-reading-position]",
			);
			// Inspecting a step is an explicit reading action. Capture the
			// anchor before React changes its height or opens a side panel.
			if (trigger && content.contains(trigger)) pause();
		};
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (
				event.target instanceof Element &&
				event.target.closest(
					"input, textarea, select, [contenteditable=true]",
				)
			)
				return;
			if (
				["ArrowUp", "PageUp", "Home"].includes(event.key) ||
				(event.key === " " && event.shiftKey)
			)
				pause();
		};
		const handleTouchStart = (event: TouchEvent): void => {
			touchY =
				event.touches.length === 1
					? (event.touches[0]?.clientY ?? null)
					: null;
		};
		const handleTouchMove = (event: TouchEvent): void => {
			const nextY = event.touches[0]?.clientY;
			if (
				event.touches.length === 1 &&
				touchY !== null &&
				nextY !== undefined &&
				nextY > touchY
			)
				pause();
			touchY = nextY ?? null;
		};
		const handleScroll = (): void => {
			const top = viewport.scrollTop;
			if (Math.abs(top - lastTop) < 1) return;
			const movedUp = top < lastTop - 1;
			const atBottom =
				viewport.scrollHeight - viewport.clientHeight - top <= 2;
			lastTop = top;
			updateMoreBelow();
			if (atBottom && (following.current || !movedUp)) {
				following.current = true;
				setIsFollowing(true);
			} else if (movedUp) {
				pause();
			}
			if (!following.current) rememberAnchor();
		};
		resume.current = () => {
			following.current = true;
			setIsFollowing(true);
			isSmooth = !reducedMotion;
			lastTime = performance.now();
			schedule();
		};
		const observer = new ResizeObserver(schedule);
		observer.observe(viewport);
		observer.observe(content);
		viewport.addEventListener("scroll", handleScroll, { passive: true });
		viewport.addEventListener("wheel", handleWheel, { passive: true });
		viewport.addEventListener("click", handleDisclosure, true);
		viewport.addEventListener("keydown", handleKeyDown);
		viewport.addEventListener("touchstart", handleTouchStart, {
			passive: true,
		});
		viewport.addEventListener("touchmove", handleTouchMove, {
			passive: true,
		});
		update(performance.now());
		return () => {
			observer.disconnect();
			viewport.removeEventListener("scroll", handleScroll);
			viewport.removeEventListener("wheel", handleWheel);
			viewport.removeEventListener("click", handleDisclosure, true);
			viewport.removeEventListener("keydown", handleKeyDown);
			viewport.removeEventListener("touchstart", handleTouchStart);
			viewport.removeEventListener("touchmove", handleTouchMove);
			if (frame !== null) cancelAnimationFrame(frame);
			resume.current = null;
		};
	}, [viewport, content, resetKey, reducedMotion, initialFollow]);

	useLayoutEffect(() => {
		if (resumeSignal === previousSignal.current) return;
		previousSignal.current = resumeSignal;
		resume.current?.();
	}, [resumeSignal]);

	const scrollToLatest = useCallback(() => resume.current?.(), []);
	return {
		viewportRef: setViewport,
		contentRef: setContent,
		isFollowing,
		hasMoreBelow,
		scrollToLatest,
	};
}
