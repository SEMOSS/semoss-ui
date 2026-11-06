import { LogInIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button, Small } from "@semoss/ui/next";
import type { RoomToolCallSlotProps } from "../../host/room-integration";
import { signInToProvider } from "../connector-sign-in";
import { getConnectorToolService } from "../connector-tools";
import { useConnectProvider } from "../use-connect-provider";

/**
 * Under a connector call that failed for want of a sign in: says so, with
 * the way to sign in right there.
 *
 * @component
 */
export const ConnectorToolSignIn = ({ tool }: RoomToolCallSlotProps) => {
	const { t } = useTranslation("chatConnectors");
	const handleSignIn = useConnectProvider(signInToProvider);
	const provider = getConnectorToolService(tool.json)?.provider;
	if (!provider) {
		return null;
	}
	const account = t(`providers.${provider}.name`);
	return (
		<div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-2">
			<LogInIcon aria-hidden className="size-4 shrink-0 text-warning" />
			<Small className="min-w-0 flex-1 text-foreground">
				{t("signIn.toolFailed", { account: account })}
			</Small>
			<Button size="sm" onClick={() => handleSignIn(provider)}>
				{t("signIn.toolAction", { account: account })}
			</Button>
		</div>
	);
};
