import { useEffect, useState } from "react";

/**
 * Component that displays a full-screen overlay when the device is in landscape mode on mobile
 * Prevents users from using the app in landscape orientation
 */
export const LandscapeRestriction = () => {
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		const landscapeQuery = window.matchMedia("(orientation: landscape)");
		// coarse pointer = touchscreen (mobile/tablet), fine pointer = mouse (desktop/laptop)
		const touchQuery = window.matchMedia("(pointer: coarse)");

		const check = () => {
			setIsLandscape(touchQuery.matches && landscapeQuery.matches);
		};

		check();
		landscapeQuery.addEventListener("change", check);
		touchQuery.addEventListener("change", check);

		return () => {
			landscapeQuery.removeEventListener("change", check);
			touchQuery.removeEventListener("change", check);
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
