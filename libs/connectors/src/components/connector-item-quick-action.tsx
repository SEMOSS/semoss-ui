import { DownloadIcon, MessageSquarePlusIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { ConnectorIconButton } from "./connector-icon-button";
import type { ConnectorItemActions } from "./connector-item-actions";

/** Props for {@link ConnectorItemQuickAction}. */
export interface ConnectorItemQuickActionProps {
	/** The item's actions. */
	actions: ConnectorItemActions;
}

/**
 * The one action a row shows as a button, as the file explorer's rows do:
 * adding the item to the conversation, or saving it where the host takes
 * nothing into its context. Everything is on the row's right-click menu.
 * Renders nothing when the item can be neither.
 */
export const ConnectorItemQuickAction = ({
	actions,
}: ConnectorItemQuickActionProps) => {
	const { t } = useTranslation("connectors");
	const {
		itemName,
		onAddToContext,
		onSave,
		saveLabel,
		isBusy = false,
	} = actions;

	if (onAddToContext) {
		return (
			<ConnectorIconButton
				icon={MessageSquarePlusIcon}
				label={t("actions.addToContext")}
				ariaLabel={t("actions.addNamedToContext", { name: itemName })}
				isInactive={isBusy}
				onClick={onAddToContext}
			/>
		);
	}
	if (onSave) {
		return (
			<ConnectorIconButton
				icon={DownloadIcon}
				label={saveLabel}
				ariaLabel={t("actions.named", {
					action: saveLabel,
					name: itemName,
				})}
				isInactive={isBusy}
				onClick={onSave}
			/>
		);
	}
	return null;
};
