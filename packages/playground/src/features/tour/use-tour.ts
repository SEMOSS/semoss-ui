import { useContext } from "react";
import { TourContext } from "@/features/tour/tour.context";

export const useTour = () => {
	const context = useContext(TourContext);
	if (!context) {
		throw new Error("useTour must be used within a TourContext provider");
	}
	return context;
};
