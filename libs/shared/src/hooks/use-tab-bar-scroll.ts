import { type RefObject, useEffect } from "react";

export const useTabBarScroll = (
	containerRef: RefObject<HTMLElement | null>,
) => {
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const onWheel = (e: WheelEvent) => {
			if (!(e.target instanceof Element)) return;
			const tabBar = e.target.closest(
				".flexlayout__tabset_tabbar_inner",
			) as HTMLElement | null;
			if (!tabBar || !container.contains(tabBar)) return;
			if (tabBar.scrollWidth <= tabBar.clientWidth) return;
			const delta =
				Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
			if (delta === 0) return;
			tabBar.scrollLeft += delta;
			e.preventDefault();
			e.stopPropagation();
		};
		container.addEventListener("wheel", onWheel, {
			capture: true,
			passive: false,
		});
		return () => container.removeEventListener("wheel", onWheel, true);
	}, [containerRef]);
};
