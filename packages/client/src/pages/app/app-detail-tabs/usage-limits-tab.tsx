import { TokenLimitsPanel } from "@/pages/settings/usage-limits/components/token-limits-panel";

interface UsageLimitsTabProps {
	appId: string;
	appName: string;
}

export const UsageLimitsTab = ({ appId, appName }: UsageLimitsTabProps) => {
	return (
		<div className="flex w-full flex-col items-start gap-6 self-stretch">
			<TokenLimitsPanel
				entityType="APP"
				entityId={appId}
				entityName={appName}
			/>
		</div>
	);
};
