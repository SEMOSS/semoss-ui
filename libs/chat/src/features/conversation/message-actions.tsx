import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { ButtonGroup, cn, Muted } from "@semoss/ui/next";

interface MessageActionsProps {
	/** Existing message actions, preserving their handlers and availability. */
	children: ReactNode;
	/** Aligns input actions with their bubble and response actions with their text. */
	align?: "start" | "end";
	/** Optional timestamp shown with the actions instead of in the transcript. */
	dateCreated?: Date;
	/** Keeps the controls visible while an action's dialog is open. */
	isDialogOpen?: boolean;
}

/** Reveals floating actions on hover or keyboard focus, with visible touch controls. */
export function MessageActions({
	children,
	align = "start",
	dateCreated,
	isDialogOpen = false,
}: MessageActionsProps) {
	const { t } = useTranslation("chat");

	return (
		<div
			data-dialog-open={isDialogOpen}
			className={cn(
				"w-max max-w-72 pt-2",
				"[@media(hover:hover)_and_(pointer:fine)]:absolute [@media(hover:hover)_and_(pointer:fine)]:top-full [@media(hover:hover)_and_(pointer:fine)]:z-10",
				"[@media(hover:hover)_and_(pointer:fine)]:pointer-events-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0",
				"focus-within:pointer-events-auto focus-within:opacity-100 group-hover/message:pointer-events-auto group-hover/message:opacity-100 data-[dialog-open=true]:pointer-events-auto data-[dialog-open=true]:opacity-100",
				align === "end" ? "end-0" : "start-4",
			)}
		>
			<div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-sm">
				<ButtonGroup
					aria-label={t("messages.actions")}
					className="max-w-full flex-wrap items-center gap-0.5"
				>
					{children}
				</ButtonGroup>
				{dateCreated && (
					<Muted className="px-2 text-xs">
						<time dateTime={dateCreated.toISOString()}>
							{dateCreated.toLocaleString(undefined, {
								month: "numeric",
								day: "numeric",
								year: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
						</time>
					</Muted>
				)}
			</div>
		</div>
	);
}
