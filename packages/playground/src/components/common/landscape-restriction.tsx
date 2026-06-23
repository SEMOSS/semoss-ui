import { useEffect, useState } from "react";

/**
 * Component that displays a full-screen overlay when the device is in landscape mode on mobile
 * Prevents users from using the app in landscape orientation
 */
export const LandscapeRestriction = () => {
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		const checkOrientation = (): void => {
			// Only apply restriction on mobile devices (max-width: 768px)
			const isMobile = window.innerWidth <= 768;
			const isLandscapeMode = window.innerHeight < window.innerWidth;

			setIsLandscape(isMobile && isLandscapeMode);
		};

		// Check on mount
		checkOrientation();

		// Listen for orientation and resize changes
		window.addEventListener("resize", checkOrientation);
		window.addEventListener("orientationchange", checkOrientation);

		return () => {
			window.removeEventListener("resize", checkOrientation);
			window.removeEventListener("orientationchange", checkOrientation);
		};
	}, []);

	if (!isLandscape) {
		return null;
	}

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "white",
				zIndex: 9999,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "2rem",
				textAlign: "center",
			}}
		>
			<div
				style={{
					fontSize: "3rem",
					marginBottom: "1rem",
					animation: "rotate 2s ease-in-out infinite",
				}}
			>
				📱
			</div>
			<h1
				style={{
					fontSize: "1.5rem",
					fontWeight: "bold",
					marginBottom: "1rem",
					color: "#1f2937",
				}}
			>
				Please Rotate Your Device
			</h1>
			<p
				style={{
					fontSize: "1rem",
					color: "#6b7280",
					maxWidth: "400px",
					lineHeight: "1.5",
				}}
			>
				We don't support landscape mode yet. Please go back to portrait
				mode for the best experience.
			</p>
			<style>
				{`
					@keyframes rotate {
						0%, 100% {
							transform: rotate(0deg);
						}
						50% {
							transform: rotate(90deg);
						}
					}
				`}
			</style>
		</div>
	);
};
