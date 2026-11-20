import { useContext } from "react";
import {
	TourContext,
	type TourContextValue,
} from "@/features/tour/tour.context";

/**
 * Read the landing tour's state and controls.
 *
 * @returns Whether the tour is open, and `startTour` / `stopTour`.
 * @throws When called outside `TourContext`'s provider.
 */
export const useTour = (): TourContextValue => {
	const context = useContext(TourContext);
	if (!context) {
		throw new Error("useTour must be used within a TourContext provider");
	}
	return context;
};
