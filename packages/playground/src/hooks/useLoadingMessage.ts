import { useEffect, useState } from "react";
import { LOADING_MESSAGES } from "@/constants";

export const useLoadingMessage = (iterate: boolean) => {
	const [loadingMessage, setLoadingMessage] = useState<string>("");

	// iterate loading messages
	useEffect(() => {
		if (!iterate) {
			setLoadingMessage("");
			return;
		}

		setLoadingMessage(LOADING_MESSAGES[0]);

		let timeoutId: number | undefined;
		let iteration = 1;
		let cancelled = false;

		const scheduleNext = () => {
			const delay = Math.min(8000, 2000 + 1200 * (iteration - 1));

			timeoutId = window.setTimeout(() => {
				if (cancelled) {
					return;
				}

				const randomIndex =
					1 +
					Math.floor(Math.random() * (LOADING_MESSAGES.length - 1));

				setLoadingMessage(LOADING_MESSAGES[randomIndex]);
				iteration += 1;
				scheduleNext();
			}, delay);
		};

		scheduleNext();

		return () => {
			cancelled = true;
			if (timeoutId !== undefined) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [iterate]);

	return loadingMessage;
};
