import { LoaderCircleIcon, MessageSquarePlusIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button, cn } from "@semoss/ui/next";
import { ConnectorIconButton } from "../components/connector-icon-button";
import { ConnectorItemMenu } from "../components/connector-item-menu";
import type { ConnectorItemRowProps } from "../components/connector-item-row";

/** A narrow mail row: sender and date precede a two-line subject. */
export const MailCompactRow = ({
	itemKey,
	title,
	description,
	meta,
	isEmphasized,
	onOpen,
	openLabel,
	isBusy,
	actions,
}: ConnectorItemRowProps) => {
	const { t } = useTranslation("connectors");
	return (
		<ConnectorItemMenu actions={actions}>
			<li
				className={cn(
					"flex min-w-0 items-center gap-1 border-border/60 border-b pe-2 last:border-b-0 focus-within:bg-accent/40 hover:bg-accent/60",
					isEmphasized && "bg-accent/20",
				)}
				aria-busy={isBusy || undefined}
			>
				<Button
					type="button"
					variant="ghost"
					className="h-auto min-w-0 flex-1 flex-col items-stretch gap-1 whitespace-normal rounded-none px-3 py-2 text-start font-normal hover:bg-transparent dark:hover:bg-transparent"
					aria-label={openLabel}
					data-item-key={itemKey}
					onClick={onOpen}
				>
					<span className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
						{isEmphasized ? (
							<span
								aria-hidden
								className="size-2 shrink-0 rounded-full bg-primary"
							/>
						) : null}
						<span
							className="min-w-0 flex-1 truncate"
							title={description}
						>
							{description}
						</span>
						<span className="shrink-0 tabular-nums">{meta}</span>
					</span>
					<span
						className={cn(
							"wrap-anywhere line-clamp-2 min-w-0 text-foreground text-sm",
							isEmphasized && "font-medium",
						)}
						title={title}
					>
						{title}
					</span>
				</Button>
				{actions?.onAddToContext ? (
					<ConnectorIconButton
						icon={isBusy ? LoaderCircleIcon : MessageSquarePlusIcon}
						label={t("actions.addToChat")}
						ariaLabel={t("actions.named", {
							action: t("actions.addToChat"),
							name: title,
						})}
						isInactive={isBusy}
						isSpinning={isBusy}
						onClick={actions.onAddToContext}
					/>
				) : null}
			</li>
		</ConnectorItemMenu>
	);
};
