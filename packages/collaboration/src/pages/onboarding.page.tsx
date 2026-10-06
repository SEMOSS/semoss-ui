import { useInsight } from "@semoss/sdk/react";
import { Onboarding } from "@/features/onboarding/onboarding";

/** First run with real mail, outside the Work and Brain shell. */
export function OnboardingPage() {
	const { actions } = useInsight();
	return <Onboarding actions={actions} />;
}
