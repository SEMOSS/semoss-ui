import { createContext } from "react";

type TourContextProps = {
	isOpen: boolean;
	startTour: () => void;
	stopTour: () => void;
};

export const TourContext = createContext<TourContextProps | undefined>(
	undefined,
);
