import { useCallback, useEffect, useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Card,
	H2,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Switch,
} from "@semoss/ui/next";
import { WorkRefreshStatus } from "@/features/collaboration/live/work-refresh-status";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	type Connection,
	forgetBackgroundAccess,
	getConnection,
	saveBackgroundAccess,
} from "../api/connection";
import { connectMicrosoft } from "../api/microsoft";

const message = (cause: unknown, fallback: string) =>
	cause instanceof Error ? cause.message : fallback;

const when = (at?: string | null) =>
	at
		? new Date(at).toLocaleString([], {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			})
		: "";

const SOURCE_STATUS: Record<
	Connection["sources"][number]["status"],
	{ label: string; variant: "secondary" | "outline" | "destructive" }
> = {
	connected: { label: "Reading", variant: "secondary" },
	needs_permission: { label: "Needs sign-in", variant: "destructive" },
	off: { label: "Off", variant: "outline" },
};

// what is read and skipped, and how many folders file straight into a topic
function folderDetail(folders: NonNullable<Connection["folders"]>): string {
	const made = `${folders.custom} ${folders.custom === 1 ? "folder" : "folders"} you made`;
	const linked = folders.linked
		? ` ${folders.linked} ${folders.linked === 1 ? "folder files" : "folders file"} straight into a topic.`
		: "";
	return `Inbox, Sent, Archive and ${made}. Deleted Items, Junk and Drafts are skipped.${linked}`;
}

// pilot sources the Brain actually reads today
const SHOWN_SOURCES = new Set(["email", "calendar", "teams"]);

// what each switch does, on and off; mail and Teams feed threads, topics and work, calendar is read live (no last item)
const SOURCE_DETAIL: Record<string, { on: string; off: string }> = {
	email: {
		on: "New mail feeds your threads, topics and work.",
		off: "Paused. New mail and Teams chats are not read; what is already here stays. Turn on to catch up.",
	},
	calendar: {
		on: "Read live from Outlook; meetings show on Today and in search.",
		off: "Off. Today and search do not show meetings.",
	},
	teams: {
		on: "1:1 and group chats feed your threads, topics and work.",
		off: "Off. Turn on to bring your Teams chats into your work, starting with the chats from your import window.",
	},
};

// how often the server checks mail while the app is closed; the server accepts only these minutes
const SYNC_CHOICES = [
	{ minutes: 15, label: "Every 15 minutes" },
	{ minutes: 30, label: "Every 30 minutes" },
	{ minutes: 60, label: "Every hour" },
	{ minutes: 240, label: "Every 4 hours" },
	{ minutes: 0, label: "Off" },
] as const;

/** One row: what it is, its state, and the one action that changes it. */
function Row({
	title,
	titleId,
	detail,
	state,
	action,
}: {
	title: string;
	/** Id for the title, so a control in the row can be named by it. */
	titleId?: string;
	detail?: string;
	state?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
			<div className="min-w-0 flex-1">
				<Small id={titleId} className="font-medium text-sm">
					{title}
				</Small>
				{detail && (
					<P className="text-muted-foreground text-sm leading-5">
						{detail}
					</P>
				)}
			</div>
			{state}
			{action}
		</div>
	);
}

/** Microsoft 365 sign-in, background access and automatic updates, in that order. */
export function ConnectionsView() {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const syncTitleId = useId();
	const [connection, setConnection] = useState<Connection | null>(null);
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		setError("");
		try {
			setConnection(await getConnection(actions));
		} catch (cause: unknown) {
			setError(message(cause, "Could not read your connection."));
		}
	}, [actions]);

	useEffect(() => {
		void load();
	}, [load]);

	async function run(key: string, work: () => Promise<unknown>) {
		setBusy(key);
		setError("");
		try {
			await work();
			await load();
		} catch (cause: unknown) {
			setError(message(cause, "That did not work. Try again."));
		} finally {
			setBusy(null);
		}
	}

	const microsoft = connection?.microsoft;
	const background = connection?.background;
	const sources =
		connection?.sources.filter((source) => SHOWN_SOURCES.has(source.id)) ??
		[];
	const hasBackgroundAccess =
		background?.saved === true && background.renewable;
	const syncEveryMinutes = state.settings.syncEveryMinutes;
	const enabled = state.settings.sourcesJson;

	function toggleSource(id: string, on: boolean) {
		if (
			id === "email" &&
			!on &&
			!window.confirm(
				"Pause mail? New mail and Teams chats stop coming in until you turn it on again. Nothing already here is removed.",
			)
		)
			return;
		dispatch({
			type: "settings.save",
			changes: { sourcesJson: { ...enabled, [id]: on } },
		});
		// the server starts a catch-up read when mail or Teams turns on; show its result once it lands
		if (on && id !== "calendar") setTimeout(() => void load(), 4000);
	}

	return (
		<div className="flex min-w-0 flex-col gap-6">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Card className="gap-0 p-5 shadow-none">
				<header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
					<div className="min-w-0">
						<H2 className="font-medium text-xl">Microsoft 365</H2>
						<P className="text-muted-foreground">
							{!connection
								? "Checking your connection..."
								: microsoft?.signedIn
									? `Signed in as ${microsoft.account ?? "your Microsoft account"}.`
									: "Not connected. Connect to let the assistant read your mail, Teams chats and calendar."}
						</P>
						{connection?.mailbox && (
							<P className="text-muted-foreground text-sm">
								Mail is read from {connection.mailbox}.
							</P>
						)}
					</div>
					{connection && !microsoft?.signedIn && (
						<Button
							type="button"
							disabled={busy !== null}
							onClick={() =>
								void run("connect", connectMicrosoft)
							}
						>
							{busy === "connect"
								? "Connecting..."
								: "Connect Microsoft"}
						</Button>
					)}
				</header>
				<div className="divide-y">
					{connection?.folders?.known && (
						<Row
							title="Outlook folders"
							detail={folderDetail(connection.folders)}
							state={
								<Badge variant="secondary">
									{connection.folders.read} read
								</Badge>
							}
						/>
					)}
					{sources.map((source) => {
						const on = enabled[source.id] === true;
						// a switch once the import has run; before that the import turns sources on
						const canToggle = connection?.imported === true;
						// Teams is read by the mail sync, so it waits while mail is paused
						const waitsOnMail =
							source.id === "teams" &&
							on &&
							enabled.email !== true;
						const status =
							SOURCE_STATUS[
								canToggle && !on
									? "off"
									: source.status === "off" && on
										? "connected"
										: source.status
							];
						const words = SOURCE_DETAIL[source.id];
						const detail = waitsOnMail
							? "Paused while mail is paused."
							: [
									words && canToggle
										? on
											? words.on
											: words.off
										: "",
									on &&
									source.id !== "calendar" &&
									source.lastSync
										? `Last new item ${when(source.lastSync)}.`
										: "",
								]
									.filter(Boolean)
									.join(" ") || undefined;
						const titleId = `${syncTitleId}-${source.id}`;
						return (
							<Row
								key={source.id}
								title={source.label}
								titleId={titleId}
								detail={detail}
								state={
									<Badge variant={status.variant}>
										{waitsOnMail ? "Paused" : status.label}
									</Badge>
								}
								action={
									canToggle && (
										<Switch
											aria-labelledby={titleId}
											checked={on}
											disabled={busy !== null}
											onCheckedChange={(next) =>
												toggleSource(source.id, next)
											}
										/>
									)
								}
							/>
						);
					})}
				</div>
			</Card>

			<Card className="gap-0 p-5 shadow-none">
				<header className="space-y-1 border-b pb-4">
					<H2 className="font-medium text-xl">Automatic updates</H2>
					<P className="text-muted-foreground">
						How new mail reaches the assistant without you pressing
						Refresh.
					</P>
				</header>
				<div className="divide-y">
					<Row
						title="Check while the app is open"
						detail="Every minute, and when you come back to the tab."
						state={<WorkRefreshStatus />}
					/>
					<Row
						title="Background access"
						detail={
							background?.saved
								? background.renewable
									? `Saved for ${background.account ?? "your account"}. Routines and updates keep working with the app closed. Microsoft renews it; if it stops, press Update.`
									: "Saved, but it can no longer be renewed. Sign out, sign back in with Microsoft, then press Update."
								: background?.otherAccount
									? "You are signed in to a different Microsoft account than the one your mail is read from. Sign out and sign in with that account to turn this on."
									: background?.canSave
										? "Off. Turn on to let routines and updates read your mail when the app is closed."
										: "Off. Sign out and sign back in with Microsoft so a renewable sign-in can be saved."
						}
						state={
							<Badge
								variant={
									background?.saved && background.renewable
										? "secondary"
										: "outline"
								}
							>
								{background?.saved && background.renewable
									? "On"
									: "Off"}
							</Badge>
						}
						action={
							background?.saved ? (
								<div className="flex gap-2">
									{background.canSave && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											disabled={busy !== null}
											onClick={() =>
												void run("save", () =>
													saveBackgroundAccess(
														actions,
													),
												)
											}
										>
											Update
										</Button>
									)}
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={busy !== null}
										onClick={() => {
											if (
												window.confirm(
													"Turn off background access? Scheduled routines and checks while the app is closed stop until you turn it on again.",
												)
											)
												void run("forget", () =>
													forgetBackgroundAccess(
														actions,
													),
												);
										}}
									>
										Turn off
									</Button>
								</div>
							) : (
								<Button
									type="button"
									size="sm"
									disabled={
										busy !== null || !background?.canSave
									}
									onClick={() =>
										void run("save", () =>
											saveBackgroundAccess(actions),
										)
									}
								>
									Turn on
								</Button>
							)
						}
					/>
					<Row
						title="Check while the app is closed"
						titleId={syncTitleId}
						detail={
							!hasBackgroundAccess
								? "Turn on background access to check while the app is closed."
								: syncEveryMinutes === 0
									? "Off. New mail is filed when you next open the app."
									: "New mail and Teams chats are filed while you are away."
						}
						action={
							<Select
								value={String(syncEveryMinutes)}
								disabled={!hasBackgroundAccess}
								onValueChange={(value) =>
									dispatch({
										type: "settings.save",
										changes: {
											syncEveryMinutes: Number(value),
										},
									})
								}
							>
								<SelectTrigger
									aria-labelledby={syncTitleId}
									className="w-44"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SYNC_CHOICES.map((choice) => (
										<SelectItem
											key={choice.minutes}
											value={String(choice.minutes)}
										>
											{choice.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						}
					/>
				</div>
			</Card>
		</div>
	);
}
