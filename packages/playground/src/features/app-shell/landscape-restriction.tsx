import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn } from "@semoss/ui/next";

/**
 * A full-screen overlay asking a phone or tablet held in landscape to rotate,
 * since the app is laid out for portrait there. Desktop browsers never see it.
 */
export const LandscapeRestriction = () => {
	const { t } = useTranslation("mobile");
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
			className={cn(
				"fixed inset-0 z-[9999]",
				"flex flex-col items-center justify-center",
				"bg-background px-8 text-center",
			)}
		>
			<span className="mb-4 animate-spin text-5xl">📱</span>
			<h1 className="mb-4 font-bold text-2xl text-foreground">
				{t("messages.rotateDevice")}
			</h1>
			<p className="max-w-sm text-base text-muted-foreground leading-relaxed">
				{t("messages.noLandscapeMode")}
			</p>
		</div>
	);
};
