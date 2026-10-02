import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import type { ConnectorViewerService } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { ConnectorBrandIcon, LoginProviderIcon } from "@semoss/shared";
import {
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@semoss/ui/next";
import { CONNECTOR_PROVIDERS } from "../connectors/connector.catalog";
import type { TeamworkStore } from "../teamwork.store";

/** Props for {@link TeamworkSourcesMenuItem}. */
export interface TeamworkSourcesMenuItemProps {
	/** The room's teamwork state. */
	teamwork: TeamworkStore;
	/** Called after a viewer is chosen, to close the menu. */
	onSelect?: () => void;
	/**
	 * Shows a chosen viewer. Defaults to the room's own sidebar; the new-chat
	 * page shows it in the room it creates early instead.
	 */
	onOpenSource?: (service: ConnectorViewerService) => void;
}

/**
 * The plus menu's viewers, one submenu per account: Microsoft 365, then
 * Google Workspace. A viewer shows once its connector is switched on for the
 * chat and its account is signed in, and a submenu with no viewers is left
 * out. Opening the menu reads the logins, reusing a read from the last half
 * minute, so signing in or out elsewhere shows up when it next opens.
 */
export const TeamworkSourcesMenuItem = observer(
	({
		teamwork,
		onSelect = () => null,
		onOpenSource = teamwork.openSourcePanel,
	}: TeamworkSourcesMenuItemProps) => {
		const { t } = useTranslation("teamwork");
		const sources = teamwork.availableSources;

		useEffect(() => {
			void teamwork.refreshConnectedProviders();
		}, [teamwork]);

		return CONNECTOR_PROVIDERS.map((provider) => {
			const offered = sources.filter(
				(source) => source.provider === provider.id,
			);
			if (offered.length === 0) {
				return null;
			}
			return (
				<DropdownMenuSub key={provider.id}>
					<DropdownMenuSubTrigger>
						<LoginProviderIcon
							provider={provider.logo}
							className="size-4 shrink-0"
						/>
						<span className="flex-1">
							{t(`providers.${provider.id}.name`)}
						</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{offered.map(({ service, brand, nameKey }) => (
							<DropdownMenuItem
								key={service}
								onSelect={() => {
									onOpenSource(service);
									onSelect();
								}}
							>
								<ConnectorBrandIcon
									brand={brand}
									className="size-4 shrink-0"
								/>
								{t(nameKey)}
							</DropdownMenuItem>
						))}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			);
		});
	},
);
