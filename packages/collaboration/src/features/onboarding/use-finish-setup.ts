import { useState } from "react";
import { toast } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { finishSetup } from "./onboarding-api";
import { message } from "./onboarding-ui";
import { rememberSetupEnded } from "./use-needs-onboarding";

interface FinishSetup {
	/** True while the server records the end of setup. */
	isFinishing: boolean;
	/** End setup, finished or skipped, and open Work. */
	finish: () => Promise<void>;
}

/** Ends setup so Today stops sending the owner back to it; a failed save still ends it for this session. */
export function useFinishSetup(actions: InsightActions): FinishSetup {
	const [isFinishing, setIsFinishing] = useState(false);
	const finish = async (): Promise<void> => {
		setIsFinishing(true);
		try {
			await finishSetup(actions);
		} catch (cause: unknown) {
			rememberSetupEnded();
			toast.error(
				`Could not save that setup is done, so it may open again next time: ${message(cause)}`,
			);
			// no reload, which would clear the message
			window.location.hash = "#/work";
			return;
		}
		window.location.hash = "#/work";
		window.location.reload();
	};
	return { isFinishing, finish };
}
