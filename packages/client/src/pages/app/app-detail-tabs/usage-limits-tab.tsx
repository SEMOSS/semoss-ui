import { useAppDetail } from "@/contexts";
import { TokenLimitsPanel } from "@/pages/settings/usage-limits/components/token-limits-panel";

export const UsageLimitsTab = () => {
	const { appId, appInfo } = useAppDetail();
	const appName =
		appInfo?.project_display_name || appInfo?.project_name || appId;

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
