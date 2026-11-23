import { useEffect, useMemo, useState } from "react";
import type { PlaygroundTheme } from "@semoss/shared";
import type { TourContextValue } from "@/features/tour/tour.context";

/** What {@link useLandingTour} returns. */
interface UseLandingTourReturn {
	/** The tour's state and controls, for `TourContext`. */
	tour: TourContextValue;
	/** The welcome dialog was acknowledged: starts a tour that waited for it. */
	acknowledgeWelcome: () => void;
}

/**
 * The landing tour's state, held by the layout that provides `TourContext`.
 * The tour shows itself once for a first-time user (remembered in a cookie,
 * so clearing cookies shows it again), unless the theme turns it off; when
 * the theme has a welcome dialog, it waits until that is acknowledged.
 *
 * @param theme - The playground's theme.
 * @returns The tour's context value, and the welcome dialog's callback.
 */
export const useLandingTour = (
	theme: PlaygroundTheme,
): UseLandingTourReturn => {
	const [isOpen, setIsOpen] = useState(false);
	// The tour waits for the welcome dialog when the theme shows one.
	const [isPending, setIsPending] = useState(false);

	useEffect(() => {
		if (theme.tour?.show === false) return;
		const hasSeen = document.cookie
			.split("; ")
			.find((c) => c.startsWith("hasSeenTour="));
		if (!hasSeen) {
			// biome-ignore lint/suspicious/noDocumentCookie: TODO: why not use localStorage?
			document.cookie = "hasSeenTour=true; path=/; max-age=31536000"; // 1 year
			if (theme.dialog) {
				setIsPending(true);
			} else {
				setIsOpen(true);
			}
		}
	}, [theme.tour?.show, theme.dialog]);

	const tour = useMemo<TourContextValue>(
		() => ({
			isOpen,
			startTour: () => setIsOpen(true),
			stopTour: () => setIsOpen(false),
		}),
		[isOpen],
	);

	const acknowledgeWelcome = (): void => {
		if (isPending) {
			setIsPending(false);
			setIsOpen(true);
		}
	};

	return { tour, acknowledgeWelcome };
};
