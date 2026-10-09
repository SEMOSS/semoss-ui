import { CircleCheckIcon, ExternalLinkIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	Button,
	Muted,
	Spinner,
} from "@semoss/ui/next";

/** Props for {@link ToolOutcomePanel}. */
export interface ToolOutcomePanelProps {
	/** What the user did, such as `Saved as a draft in Gmail.` */
	message: string;
	/** Where the result opens in its app. */
	webUrl?: string;
	/** The app it opens in, such as `Gmail`. */
	appName: string;
	/** Whether the agent is being told. */
	isReturning: boolean;
	/** Why telling the agent failed. */
	error?: string | null;
	/** Tells the agent what the user did, so the conversation continues. */
	onReturn: () => void;
}

/**
 * What a tool view shows after the user ran another operation in place of
 * the call: what was done, and Back to the Agent. The call waits until the
 * user goes back, so the agent continues from what really happened.
 */
export const ToolOutcomePanel = ({
	message,
	webUrl,
	appName,
	isReturning,
	error,
	onReturn,
}: ToolOutcomePanelProps) => {
	const { t } = useTranslation("connectors");
	return (
		<div className="flex flex-col gap-3">
			<output className="flex items-start gap-2 text-sm">
				<CircleCheckIcon
					aria-hidden
					className="mt-0.5 size-4 shrink-0 text-muted-foreground"
				/>
				<span className="wrap-anywhere">{message}</span>
			</output>
			<Muted className="text-xs">{t("toolViews.backToAgentNote")}</Muted>
			{error ? (
				<Alert variant="destructive">
					<AlertDescription className="wrap-anywhere">
						{error}
					</AlertDescription>
				</Alert>
			) : null}
			<div className="flex flex-wrap justify-end gap-2">
				{webUrl ? (
					<Button variant="ghost" size="sm" asChild>
						<a
							href={webUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon aria-hidden />
							{t("actions.openIn", { service: appName })}
						</a>
					</Button>
				) : null}
				<Button size="sm" disabled={isReturning} onClick={onReturn}>
					{isReturning ? <Spinner className="size-4" /> : null}
					{t("toolViews.backToAgent")}
				</Button>
			</div>
		</div>
	);
};
