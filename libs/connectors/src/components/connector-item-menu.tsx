import {
	DownloadIcon,
	ExternalLinkIcon,
	MessageSquarePlusIcon,
} from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@semoss/ui/next";
import {
	type ConnectorItemActions,
	hasItemActions,
} from "./connector-item-actions";

/** Props for {@link ConnectorItemMenu}. */
export interface ConnectorItemMenuProps {
	/** The item's actions, or nothing for an item without any. */
	actions?: ConnectorItemActions | null;
	/** What the menu opens on, such as the item's row. */
	children: ReactElement;
}

/**
 * An item's actions on a right-click, as the file explorer offers a file's:
 * add it to the conversation, save it into the insight's files, or open it in
 * its own app. A long press opens the menu on a touch screen, and the context
 * menu key or Shift+F10 on a focused row.
 */
export const ConnectorItemMenu = ({
	actions,
	children,
}: ConnectorItemMenuProps) => {
	const { t } = useTranslation("connectors");

	if (!hasItemActions(actions)) {
		return children;
	}
	const {
		onAddToContext,
		onSave,
		saveLabel,
		webUrl,
		serviceName,
		isBusy = false,
	} = actions;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{onAddToContext ? (
					<ContextMenuItem
						disabled={isBusy}
						onSelect={onAddToContext}
					>
						<MessageSquarePlusIcon aria-hidden />
						{t("actions.addToContext")}
					</ContextMenuItem>
				) : null}
				{onSave ? (
					<ContextMenuItem disabled={isBusy} onSelect={onSave}>
						<DownloadIcon aria-hidden />
						{saveLabel}
					</ContextMenuItem>
				) : null}
				{webUrl ? (
					<ContextMenuItem asChild>
						<a
							href={webUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon aria-hidden />
							{t("actions.openIn", { service: serviceName })}
						</a>
					</ContextMenuItem>
				) : null}
			</ContextMenuContent>
		</ContextMenu>
	);
};
