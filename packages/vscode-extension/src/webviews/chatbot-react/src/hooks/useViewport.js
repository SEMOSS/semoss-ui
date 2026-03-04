import { useEffect, useState } from "react";
// Hook: useViewport
// Tracks viewport dimensions + derived booleans used for responsive adjustments.

/**
 * Custom hook for viewport management
 * Replaces the viewport state management from the original SemossChatbot class
 */
export const useViewport = () => {
	const [viewport, setViewport] = useState(() => ({
		width: window.innerWidth,
		height: window.innerHeight,
		isSmallPhone: window.innerWidth <= 375,
		isMobile: window.innerWidth <= 768,
		isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
		isDesktop: window.innerWidth > 1024,
		isLandscape: window.innerWidth > window.innerHeight,
	}));

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			setViewport({
				width,
				height,
				isSmallPhone: width <= 375,
				isMobile: width <= 768,
				isTablet: width > 768 && width <= 1024,
				isDesktop: width > 1024,
				isLandscape: width > height,
			});
		};

		const handleOrientationChange = () => {
			// Delay to ensure dimensions are updated after orientation change
			setTimeout(handleResize, 100);
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleOrientationChange);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener(
				"orientationchange",
				handleOrientationChange,
			);
		};
	}, []);

	return viewport;
};
