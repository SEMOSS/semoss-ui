import { LogInIcon, ShieldAlertIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import { getConnectorProvider } from "../connectors/connector.catalog";
import { signInToProvider } from "../connectors/connector-sign-in";
import { useConnectProvider } from "../connectors/use-connect-provider";
import type { TeamworkStore } from "../teamwork.store";
import { useTeamworkLogins } from "../use-teamwork-logins";

/** Props for {@link TeamworkSignInNotice}. */
export interface TeamworkSignInNoticeProps {
	/** The room's teamwork state. */
	teamwork: TeamworkStore;
}

/**
 * Tells the user when some of the chat's switched on connectors cannot run,
 * since the assistant is offered their tools and every call would fail:
 *
 * - The session is not signed in to the connector's account. Signing in
 *   starts from the notice's button.
 * - This server's sign in for the account does not allow the connector, as
 *   the server judges from the permissions the sign in asks for. No sign in
 *   fixes that, so the notice sends the user to an administrator.
 *
 * The logins are read when the notice mounts and whenever the window regains
 * focus ({@link useTeamworkLogins}), so signing in or out in another tab shows
 * up here.
 */
export const TeamworkSignInNotice = observer(
	({ teamwork }: TeamworkSignInNoticeProps) => {
		const { t, i18n } = useTranslation("teamwork");
		const handleSignIn = useConnectProvider(signInToProvider);
		useTeamworkLogins(teamwork);

		const list = new Intl.ListFormat(i18n.language, {
			type: "conjunction",
		});
		const missing = teamwork.missingSignIns;
		const unoffered = teamwork.unofferedProviders;
		const uncovered = teamwork.uncoveredConnectors;
		if (
			missing.length === 0 &&
			unoffered.length === 0 &&
			uncovered.length === 0
		) {
			return null;
		}

		/**
		 * The names of the chat's switched on connectors for an account.
		 *
		 * @param providerId - The account.
		 * @return The names, joined for a sentence.
		 */
		const listServices = (providerId: (typeof missing)[number]): string =>
			list.format(
				getConnectorProvider(providerId)
					.services.filter((service) =>
						teamwork.connectors.includes(service),
					)
					.map((service) => t(`services.${service}.name`)),
			);

		return (
			<ul className="flex shrink-0 flex-col divide-y divide-warning/30 border-warning/30 border-b bg-warning/10">
				{missing.map((providerId) => {
					const account = t(`providers.${providerId}.name`);
					return (
						<li
							key={`sign-in-${providerId}`}
							className="flex min-w-0 items-center gap-2 px-3 py-1.5"
						>
							<LogInIcon
								aria-hidden
								className="size-4 shrink-0 text-warning"
							/>
							<span className="min-w-0 flex-1 text-sm">
								{t("signIn.notice", {
									account: account,
									services: listServices(providerId),
								})}
							</span>
							<Button
								size="sm"
								className="shrink-0"
								onClick={() => handleSignIn(providerId)}
							>
								{t("signIn.action")}
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								className="shrink-0"
								aria-label={t("signIn.dismiss", {
									account: account,
								})}
								onClick={() =>
									teamwork.dismissSignIn(providerId)
								}
							>
								<XIcon aria-hidden />
							</Button>
						</li>
					);
				})}
				{unoffered.map((providerId) => {
					const account = t(`providers.${providerId}.name`);
					return (
						<li
							key={`not-offered-${providerId}`}
							className="flex min-w-0 items-center gap-2 px-3 py-1.5"
						>
							<ShieldAlertIcon
								aria-hidden
								className="size-4 shrink-0 text-warning"
							/>
							<span className="min-w-0 flex-1 text-sm">
								{t("signIn.notOffered", {
									account: account,
									services: listServices(providerId),
								})}
							</span>
							<Button
								variant="ghost"
								size="icon-sm"
								className="shrink-0"
								aria-label={t("signIn.dismiss", {
									account: account,
								})}
								onClick={() =>
									teamwork.dismissSignIn(providerId)
								}
							>
								<XIcon aria-hidden />
							</Button>
						</li>
					);
				})}
				{uncovered.map(({ providerId, services }) => {
					const account = t(`providers.${providerId}.name`);
					return (
						<li
							key={`scopes-${providerId}`}
							className="flex min-w-0 items-center gap-2 px-3 py-1.5"
						>
							<ShieldAlertIcon
								aria-hidden
								className="size-4 shrink-0 text-warning"
							/>
							<span className="min-w-0 flex-1 text-sm">
								{t("scopes.notice", {
									account: account,
									services: list.format(
										services.map((service) =>
											t(`services.${service}.name`),
										),
									),
								})}
							</span>
							<Button
								variant="ghost"
								size="icon-sm"
								className="shrink-0"
								aria-label={t("scopes.dismiss", {
									account: account,
								})}
								onClick={() =>
									teamwork.dismissScopeNotice(providerId)
								}
							>
								<XIcon aria-hidden />
							</Button>
						</li>
					);
				})}
			</ul>
		);
	},
);
