import { useEffect, useState } from "react";

/**
 * Component that displays a full-screen overlay when the device is in landscape mode on mobile
 * Prevents users from using the app in landscape orientation
 */
export const LandscapeRestriction = () => {
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		// userAgent is the most reliable signal for excluding desktops —
		// no real desktop browser includes Mobi/Android/iPhone/iPad/iPod.
		// Devtools device emulation also spoofs the UA, so this works for testing too.
		const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(
			navigator.userAgent,
		);

		// innerWidth > innerHeight is the simplest cross-browser orientation check
		// and is always accurate once the browser has finished resizing.
		const checkOrientation = () => {
			setIsLandscape(
				isMobileDevice && window.innerWidth > window.innerHeight,
			);
		};

		// orientationchange fires before the browser has updated its dimensions
		// on many devices (iOS, some Android). Delaying 100ms lets them settle.
		const handleOrientationChange = () => {
			setTimeout(checkOrientation, 100);
		};

		checkOrientation();
		// resize is always fired after dimensions update, so no delay needed.
		window.addEventListener("resize", checkOrientation);
		window.addEventListener("orientationchange", handleOrientationChange);
		screen.orientation?.addEventListener("change", handleOrientationChange);

		return () => {
			window.removeEventListener("resize", checkOrientation);
			window.removeEventListener(
				"orientationchange",
				handleOrientationChange,
			);
			screen.orientation?.removeEventListener(
				"change",
				handleOrientationChange,
			);
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
