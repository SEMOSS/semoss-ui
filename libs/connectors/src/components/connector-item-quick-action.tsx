import {
	DownloadIcon,
	LoaderCircleIcon,
	MessageSquarePlusIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { ConnectorIconButton } from "./connector-icon-button";
import type { ConnectorItemActions } from "./connector-item-actions";
import { ConnectorSavedMark } from "./connector-saved-mark";

/** Props for {@link ConnectorItemQuickAction}. */
interface ConnectorItemQuickActionProps {
	/** The item's actions. */
	actions: ConnectorItemActions;
}

/**
 * The one action a row shows as a button, as the file explorer's rows do:
 * adding the item to the conversation, or saving it where the host takes
 * nothing into its context. Everything is on the row's right-click menu.
 * An item the host already holds shows that in place of the save button.
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
		savedLabel,
		isBusy = false,
	} = actions;

	if (onAddToContext) {
		return (
			<ConnectorIconButton
				icon={isBusy ? LoaderCircleIcon : MessageSquarePlusIcon}
				label={t("actions.addToContext")}
				ariaLabel={t("actions.addNamedToContext", { name: itemName })}
				isInactive={isBusy}
				isSpinning={isBusy}
				onClick={onAddToContext}
			/>
		);
	}
	if (savedLabel) {
		return (
			// as wide as the button it stands in for, so the rows' dates stay in line
			<span
				role="img"
				aria-label={t("actions.named", {
					action: savedLabel,
					name: itemName,
				})}
				title={savedLabel}
				className="flex size-8 shrink-0 items-center justify-center [@media(pointer:coarse)]:size-9"
			>
				<ConnectorSavedMark />
			</span>
		);
	}
	if (onSave) {
		return (
			<ConnectorIconButton
				icon={isBusy ? LoaderCircleIcon : DownloadIcon}
				label={saveLabel}
				ariaLabel={t("actions.named", {
					action: saveLabel,
					name: itemName,
				})}
				isInactive={isBusy}
				isSpinning={isBusy}
				onClick={onSave}
			/>
		);
	}
	return null;
};
