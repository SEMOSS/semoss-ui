import type { InsightActions } from "@/lib/pixel";

export interface OnboardingStepProps {
	/** Active signed-in insight. */
	actions: InsightActions;
	/** Advance after the step's required operation succeeds. */
	onNext: () => void;
	/** Return to the previous step. */
	onBack?: () => void;
	/** Current position, for example Step 7 of 8. */
	eyebrow: string;
}
