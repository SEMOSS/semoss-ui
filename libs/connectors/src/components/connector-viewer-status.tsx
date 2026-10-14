import { LogInIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import type { ConnectorAccount } from "../core/connector.types";
import { getConnectorErrorKey } from "../core/connector-pixel";
import type { ConnectorQuery } from "../core/use-connector-query";

/**
 * Placeholder rows, shaped like a list's rows: an icon, a title line, and a
 * shorter second line. The widths vary so the placeholder reads as a list.
 */
const SKELETON_ROWS = [
	{ key: "a", title: "w-3/5", detail: "w-2/5" },
	{ key: "b", title: "w-4/5", detail: "w-1/3" },
	{ key: "c", title: "w-1/2", detail: "w-2/5" },
	{ key: "d", title: "w-2/3", detail: "w-1/4" },
	{ key: "e", title: "w-3/4", detail: "w-1/3" },
	{ key: "f", title: "w-1/2", detail: "w-1/4" },
	{ key: "g", title: "w-2/3", detail: "w-2/5" },
	{ key: "h", title: "w-3/5", detail: "w-1/3" },
];

/** Props for {@link ConnectorViewerStatus}. */
export interface ConnectorViewerStatusProps {
	/** The read to explain. Only loading, signed out, and failed reads show. */
	query: Pick<ConnectorQuery<unknown>, "status" | "error" | "reload">;
	/** The app's name, for the messages. */
	serviceName: string;
	/** The account the viewer reads with, for the sign in prompt. */
	account?: ConnectorAccount;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
	/** How many placeholder rows to draw while loading. */
	skeletonRows?: number;
}

/**
 * What a viewer shows in place of its content while it cannot show any:
 * placeholder rows while it loads, a sign in prompt, or what went wrong with
 * a way to try again. Renders nothing once the read is in.
 */
export const ConnectorViewerStatus = ({
	query,
	serviceName,
	account = "microsoft",
	onSignIn,
	skeletonRows = 6,
}: ConnectorViewerStatusProps) => {
	const { t } = useTranslation("connectors");
	const accountName = t(`accounts.${account}`);
	const [isSigningIn, setIsSigningIn] = useState(false);

	const handleSignIn = () => {
		if (!onSignIn) {
			return;
		}
		setIsSigningIn(true);
		// no await before this call: the sign in window has to open in the click
		onSignIn()
			.then((isConnected) => {
				if (isConnected) {
					query.reload();
				}
			})
			.catch(() => undefined)
			.finally(() => setIsSigningIn(false));
	};

	if (query.status === "loading") {
		return (
			<div className="flex flex-col px-2 pt-1">
				{SKELETON_ROWS.slice(0, skeletonRows).map((row) => (
					<div
						key={row.key}
						className="flex min-w-0 items-center gap-2 px-2 py-1.5"
					>
						<Skeleton className="size-4 shrink-0 rounded-sm" />
						<div className="flex min-w-0 flex-1 flex-col gap-1.5">
							<Skeleton className={cn("h-3.5", row.title)} />
							<Skeleton className={cn("h-3", row.detail)} />
						</div>
						<Skeleton className="h-3 w-10 shrink-0" />
					</div>
				))}
			</div>
		);
	}

	if (query.status === "signedOut") {
		return (
			<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
				<LogInIcon
					aria-hidden
					className="size-8 text-muted-foreground"
				/>
				<div className="flex max-w-xs flex-col gap-1">
					<span className="font-medium text-sm">
						{t("status.signInTitle", { account: accountName })}
					</span>
					<Muted>
						{onSignIn
							? t("status.signInDescription", {
									account: accountName,
									service: serviceName,
								})
							: t("status.signInElsewhere", {
									account: accountName,
									service: serviceName,
								})}
					</Muted>
				</div>
				{onSignIn ? (
					<Button
						size="sm"
						disabled={isSigningIn}
						onClick={handleSignIn}
					>
						{isSigningIn
							? t("status.signingIn")
							: t("status.signIn")}
					</Button>
				) : (
					<Button variant="outline" size="sm" onClick={query.reload}>
						{t("common.retry")}
					</Button>
				)}
			</div>
		);
	}

	if (query.status === "error" && query.error) {
		return (
			<div className="px-3 py-2">
				<Alert variant="destructive">
					<TriangleAlertIcon aria-hidden />
					<AlertTitle>
						{t("status.loadErrorTitle", { service: serviceName })}
					</AlertTitle>
					<AlertDescription>
						<p>
							{t(getConnectorErrorKey(query.error), {
								message: query.error.message,
							})}
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-2"
							onClick={query.reload}
						>
							{t("common.retry")}
						</Button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return null;
};
