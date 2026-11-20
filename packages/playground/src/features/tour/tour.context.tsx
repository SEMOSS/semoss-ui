import { createContext } from "react";

/** What {@link TourContext} gives: whether the landing tour is open, and its controls. */
export type TourContextValue = {
	/** Whether the tour is showing. */
	isOpen: boolean;
	/** Open the tour at its first step. */
	startTour: () => void;
	/** Close the tour. */
	stopTour: () => void;
};

/** The landing tour's state, provided by `AppLayout`; read it with `useTour`. */
export const TourContext = createContext<TourContextValue | undefined>(
	undefined,
);
