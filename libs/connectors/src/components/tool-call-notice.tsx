import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewCall } from "@semoss/shared";
import { Alert, AlertDescription, AlertTitle, Spinner } from "@semoss/ui/next";

/** Props for {@link ToolCallNotice}. */
export interface ToolCallNoticeProps {
	/** The call. */
	call: ToolViewCall;
	/** The app the call acts in, such as `Gmail`, for the messages. */
	appName: string;
}

/**
 * What a tool view shows before its call has a result to show: that it waits
 * to run, that it is running, that the user denied it, or why it failed.
 * Renders nothing once the call succeeded.
 */
export const ToolCallNotice = ({ call, appName }: ToolCallNoticeProps) => {
	const { t } = useTranslation("connectors");

	if (call.status === "succeeded") {
		return null;
	}
	if (call.status === "running") {
		return (
			<output className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
				<Spinner aria-hidden className="size-4" />
				{t("toolViews.running", { app: appName })}
			</output>
		);
	}
	if (call.status === "pending") {
		return (
			<output className="block px-3 py-2 text-muted-foreground text-sm">
				{t("toolViews.waiting")}
			</output>
		);
	}
	if (call.status === "declined") {
		return (
			<output className="block px-3 py-2 text-muted-foreground text-sm">
				{t("toolViews.denied")}
			</output>
		);
	}
	return (
		<div className="px-3 py-2">
			<Alert variant="destructive">
				<TriangleAlertIcon aria-hidden />
				<AlertTitle>
					{t("toolViews.failedTitle", { app: appName })}
				</AlertTitle>
				<AlertDescription className="wrap-anywhere whitespace-pre-wrap">
					{call.result || t("toolViews.failedNoDetail")}
				</AlertDescription>
			</Alert>
		</div>
	);
};
