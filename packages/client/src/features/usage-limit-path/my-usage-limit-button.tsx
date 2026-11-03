import { Gauge } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { UsageLimitPathSheet } from "./usage-limit-path-sheet";

export interface MyUsageLimitButtonProps {
	/** The model */
	engineId: string;
	/** Its name */
	modelName: string;
}

/**
 * "Your Usage Limit": opens the signed in person's own path on a
 * model, with the limit that applies to their calls and each rule's use.
 */
export const MyUsageLimitButton = ({
	engineId,
	modelName,
}: MyUsageLimitButtonProps) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				variant="outline"
				onClick={() => setIsOpen(true)}
			>
				<Gauge className="size-4" aria-hidden />
				Your Usage Limit
			</Button>
			<UsageLimitPathSheet
				request={isOpen ? { engineId } : null}
				title={`Your Usage Limit on ${modelName}`}
				description="Every limit that applies to your calls to this model, and the one they stop at."
				onClose={() => setIsOpen(false)}
			/>
		</>
	);
};
