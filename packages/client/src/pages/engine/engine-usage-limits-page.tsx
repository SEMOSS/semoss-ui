import { useEngine } from "@/hooks";
import { TokenLimitsPanel } from "../settings/usage-limits/components/token-limits-panel";

/**
 * Model-level usage limits tab.
 */
export const EngineUsageLimitsPage = () => {
	const { name, active } = useEngine();

	const engineName = active.name || name;

	return (
		<div className="flex w-full flex-col items-start gap-6 self-stretch">
			<TokenLimitsPanel
				entityType="MODEL"
				entityId={active.id}
				entityName={engineName}
			/>
		</div>
	);
};
