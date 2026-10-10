import {
	DownloadIcon,
	ExternalLinkIcon,
	MessageSquarePlusIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Props for {@link ConnectorActionBar}. */
export interface ConnectorActionBarProps {
	/** Adds what is open to the conversation. Left out when not given. */
	onAddToContext?: () => void;
	/** Saves what is open into the insight's files. */
	onSave: () => void;
	/** The save action's label, such as `Save to Chat files`. */
	saveLabel: string;
	/** Opens it in its own app. */
	webUrl?: string;
	/** The app's name, for the open action. */
	serviceName: string;
	/** Stops the actions while it is being saved. */
	isBusy?: boolean;
	/** More buttons, after the standard ones. */
	children?: ReactNode;
}

/**
 * The actions for an open email, thread, chat, or event: add it to the
 * conversation, save it into the insight's files, or open it in its own app.
 */
export const ConnectorActionBar = ({
	onAddToContext,
	onSave,
	saveLabel,
	webUrl,
	serviceName,
	isBusy = false,
	children,
}: ConnectorActionBarProps) => {
	const { t } = useTranslation("connectors");

	return (
		<div className="flex flex-wrap items-center gap-1">
			{onAddToContext ? (
				<Button
					size="sm"
					className="h-8 px-2 text-xs shadow-none aria-disabled:opacity-50"
					aria-disabled={isBusy || undefined}
					onClick={isBusy ? undefined : onAddToContext}
				>
					<MessageSquarePlusIcon aria-hidden />
					{t("actions.addToContext")}
				</Button>
			) : null}
			<Button
				variant="outline"
				size="sm"
				className="h-8 px-2 text-xs shadow-none aria-disabled:opacity-50"
				aria-disabled={isBusy || undefined}
				onClick={isBusy ? undefined : onSave}
			>
				<DownloadIcon aria-hidden />
				{saveLabel}
			</Button>
			{webUrl ? (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs"
							asChild
						>
							<a
								href={webUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLinkIcon aria-hidden />
								{t("actions.openIn", { service: serviceName })}
							</a>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t("actions.openIn", { service: serviceName })}
					</TooltipContent>
				</Tooltip>
			) : null}
			{children}
		</div>
	);
};
