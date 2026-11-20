import { RefreshCw } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	P,
	Progress,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { safeHttpsUrl } from "@semoss/utility/browser";
import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import {
	OneDriveIcon,
	OutlookIcon,
	TeamsChatsIcon,
} from "@/components/common/app-icons";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import type { VisibleResource } from "@/features/dashboard/use-visible-resource";
import {
	applyTwinUpdate,
	checkTwinUpdates,
	dismissTwinUpdate,
	removeTwinCopy,
	type TwinCheck,
	type TwinUpdate,
	type TwinUpdates as TwinUpdatesFound,
	twinCopyName,
} from "./api/twin-updates";

// how often the server checks the owner's twins by itself; it accepts only these hours
const CHECK_CHOICES = [
	{ hours: 24, label: "Every day" },
	{ hours: 4, label: "Every 4 hours" },
	{ hours: 1, label: "Every hour" },
	{ hours: 0, label: "Off" },
] as const;

// what a check is doing, by the step its job reports
const STEPS: Record<string, string> = {
	twins: "Reading what your Digital Twins hold…",
	mail: "Reading your Outlook conversations…",
	chats: "Reading your Teams chats…",
	files: "Reading your files…",
	saving: "Comparing with your copies…",
};

const KINDS = {
	email: { icon: OutlookIcon, noun: "conversation" },
	chat: { icon: TeamsChatsIcon, noun: "Teams chat" },
	file: { icon: OneDriveIcon, noun: "file" },
} as const;

const day = (at: string | undefined): string =>
	at
		? new Date(at).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
			})
		: "";

/** When something happened: the time for today, else the day and the time. */
const when = (at: string): string => {
	const date = new Date(at);
	return date.toDateString() === new Date().toDateString()
		? `today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
		: date.toLocaleString(undefined, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			});
};

/**
 * A file's name as two are compared. A copy's name is its original's as a save
 * writes it: numbered where the name was taken, and without the characters a
 * file name cannot hold. Letters and digits alone tell another name from that.
 */
const nameKey = (name: string): string =>
	name
		.replace(/ \(\d+\)(?=\.[^.]+$|$)/, "")
		.replace(/[^\p{L}\p{N}]+/gu, "")
		.toLowerCase();

/** Why an update is suggested, in a sentence or two of facts. */
function reasonFor(update: TwinUpdate): string {
	const { noun } = KINDS[update.kind];
	if (update.change === "duplicate")
		return `You hold a newer copy of this ${noun}${
			update.newerCopy ? `: "${twinCopyName(update.newerCopy)}"` : ""
		}.`;
	if (update.change === "gone")
		return update.kind === "email"
			? "The conversation was deleted, or is no longer in your mailbox."
			: update.kind === "chat"
				? "The chat is no longer in Teams."
				: "The original is no longer in its drive.";
	const latest = [
		update.latestFrom && `latest from ${update.latestFrom}`,
		day(update.latestAt),
	]
		.filter(Boolean)
		.join(", ");
	if (update.kind === "file")
		return [
			`Changed${update.latestFrom ? ` by ${update.latestFrom}` : ""}${
				update.latestAt ? ` on ${day(update.latestAt)}` : ""
			}.`,
			update.copiedAt && `Your copy is from ${day(update.copiedAt)}.`,
			// said of the original as it is, not as a rename: the copy may have had another name from the start
			update.title &&
				nameKey(update.title) !== nameKey(twinCopyName(update.path)) &&
				`The original is named "${update.title}".`,
		]
			.filter(Boolean)
			.join(" ");
	const count = update.count ?? 0;
	const what = update.kind === "email" ? "email" : "message";
	// a chat is read as far back as its newest fifty entries: when all of them are newer than the copy, more
	// may be, and the count is a floor
	const isFloor =
		update.kind === "chat" && (update.more === true || count >= 50);
	const many = `${count}${isFloor ? " or more" : ""} new ${
		count === 1 && !isFloor ? what : `${what}s`
	}`;
	return `${update.title ? `"${update.title}": ` : ""}${many}${
		latest ? `, ${latest}` : ""
	}.`;
}

/** One suggestion, however often the server lists it: a later change to the same copy is another. */
const signature = (update: TwinUpdate): string =>
	`${update.id}|${update.change}|${update.latestAt ?? ""}`;

interface TwinUpdatesProps {
	/** The twin whose page this is; only its suggestions are listed. */
	twinId: string;
	/** What waits across the owner's twins, the read the sidebar and Today share. */
	updates: VisibleResource<TwinUpdatesFound>;
	/** Told after a copy was updated or removed, so the page reads what the twin holds again. */
	onChanged: () => void;
}

/**
 * What a check found in one of the owner's twins: the copies whose original
 * has changed since, each with why, to update or to leave; and the copies to
 * remove, whose original is gone or which a newer copy stands in for.
 * Nothing changes until the owner chooses. An update saves the item again, as
 * its viewer saves it, over the copy. The owner can check now, and choose how
 * often the server checks by itself.
 */
export function TwinUpdates({ twinId, updates, onChanged }: TwinUpdatesProps) {
	const { actions, insightId } = useInsight();
	const session = useOptionalCollaborationSession();
	const id = useId();
	// a check the owner started here; one the server started by itself is in what was read
	const [ownCheck, setOwnCheck] = useState<TwinCheck | null>(null);
	const [checkError, setCheckError] = useState<{
		message: string;
		needsSignIn: boolean;
	} | null>(null);
	const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	// what the owner acted on here, left out until the list is read again without it
	const [settled, setSettled] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [isUpdatingAll, setIsUpdatingAll] = useState(false);
	// read at once, so a second press before the row redraws does not act twice
	const running = useRef(new Set<string>());

	const found = updates.data;
	const rows = (found?.updates ?? []).filter(
		(update) => update.twinId === twinId && !settled.has(signature(update)),
	);
	const changed = rows.filter((update) => update.change === "changed");
	const lastCheck = found?.lastCheck ?? null;
	const check =
		ownCheck ?? (lastCheck?.status === "running" ? lastCheck : null);
	const isChecking = check !== null;

	const handleCheck = async (): Promise<void> => {
		setCheckError(null);
		setOwnCheck({ status: "running" });
		try {
			await checkTwinUpdates(actions, setOwnCheck);
		} catch (cause) {
			const reason = cause instanceof Error ? cause.message : "";
			// in place of a reason, a lost Microsoft sign-in names the account to sign in to, as JSON
			const account = tryParseJson(reason);
			const needsSignIn =
				isRecord(account) && typeof account.type === "string";
			setCheckError({
				needsSignIn,
				message: needsSignIn
					? "Sign in to Microsoft 365 to check your Digital Twins."
					: reason || "The check did not work. Try again.",
			});
		} finally {
			setOwnCheck(null);
			updates.refresh();
		}
	};
	const handleSignIn = async (): Promise<void> => {
		try {
			// called before the first await, so the sign in window opens inside the click
			await connectMicrosoft();
		} catch (cause) {
			toast.error("Could not sign in to Microsoft 365.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
			return;
		}
		void handleCheck();
	};
	/** Act on one suggestion, saying how it went. Resolves to whether it worked. */
	const act = async (
		update: TwinUpdate,
		work: () => Promise<void>,
		done: string,
		failed: string,
	): Promise<boolean> => {
		if (running.current.has(update.id)) return false;
		running.current.add(update.id);
		setBusyIds((current) => new Set(current).add(update.id));
		try {
			await work();
			setSettled((current) => new Set(current).add(signature(update)));
			toast.success(done);
			return true;
		} catch (cause) {
			toast.error(failed, {
				description: cause instanceof Error ? cause.message : undefined,
			});
			return false;
		} finally {
			running.current.delete(update.id);
			setBusyIds((current) => {
				const next = new Set(current);
				next.delete(update.id);
				return next;
			});
		}
	};
	const update = (entry: TwinUpdate): Promise<boolean> => {
		const name = twinCopyName(entry.path);
		return act(
			entry,
			() => applyTwinUpdate(actions, insightId, entry),
			`Updated "${name}" in your Digital Twin.`,
			`Could not update "${name}".`,
		);
	};
	const handleUpdate = async (entry: TwinUpdate): Promise<void> => {
		if (await update(entry)) onChanged();
		// read again either way: a copy that is gone lost its suggestion on the server
		updates.refresh();
	};
	const handleUpdateAll = async (): Promise<void> => {
		setIsUpdatingAll(true);
		let count = 0;
		// one after another: one that fails says so and does not keep the rest out
		for (const entry of changed) if (await update(entry)) count += 1;
		setIsUpdatingAll(false);
		if (count > 0) onChanged();
		updates.refresh();
	};
	const handleRemove = async (entry: TwinUpdate): Promise<void> => {
		const name = twinCopyName(entry.path);
		const isRemoved = await act(
			entry,
			() => removeTwinCopy(actions, entry),
			`Removed "${name}" from your Digital Twin.`,
			`Could not remove "${name}".`,
		);
		if (isRemoved) onChanged();
		updates.refresh();
	};
	const handleDismiss = async (entry: TwinUpdate): Promise<void> => {
		const name = twinCopyName(entry.path);
		await act(
			entry,
			() => dismissTwinUpdate(actions, entry),
			`Kept "${name}" as it is.`,
			`Could not dismiss "${name}".`,
		);
		updates.refresh();
	};

	// a suggestion as a row: what the copy is, why it is suggested, and what can be done about it
	const renderRow = (entry: TwinUpdate) => {
		const name = twinCopyName(entry.path);
		const Icon = KINDS[entry.kind].icon;
		const isBusy = busyIds.has(entry.id) || isUpdatingAll;
		const original = safeHttpsUrl(entry.webUrl);
		return (
			<li
				key={entry.id}
				className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-start sm:gap-3"
			>
				{/* the mark stays beside the name on a phone; only what can be done moves under them */}
				<div className="flex min-w-0 flex-1 items-start gap-3">
					<Icon
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0"
					/>
					<div className="min-w-0 flex-1">
						<P className="wrap-anywhere font-medium text-sm">
							{name}
						</P>
						<P className="wrap-anywhere text-muted-foreground text-sm">
							{reasonFor(entry)}
							{original && (
								<>
									{" "}
									<a
										href={original}
										target="_blank"
										rel="noreferrer"
										className="underline underline-offset-2 hover:text-foreground"
									>
										Open original
									</a>
								</>
							)}
						</P>
					</div>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2 ps-7 sm:ps-0">
					{entry.change === "changed" ? (
						<>
							<Button
								type="button"
								size="sm"
								className="pointer-coarse:min-h-11"
								disabled={isBusy}
								aria-label={`Update: ${name}`}
								onClick={() => void handleUpdate(entry)}
							>
								{busyIds.has(entry.id) && (
									<Spinner
										aria-hidden="true"
										data-icon="inline-start"
									/>
								)}
								Update
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="pointer-coarse:min-h-11"
								disabled={isBusy}
								aria-label={`Dismiss: ${name}`}
								onClick={() => void handleDismiss(entry)}
							>
								Dismiss
							</Button>
						</>
					) : (
						<>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="pointer-coarse:min-h-11"
								disabled={isBusy}
								aria-label={`Remove copy: ${name}`}
								onClick={() => void handleRemove(entry)}
							>
								{busyIds.has(entry.id) && (
									<Spinner
										aria-hidden="true"
										data-icon="inline-start"
									/>
								)}
								Remove copy
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="pointer-coarse:min-h-11"
								disabled={isBusy}
								aria-label={`Keep: ${name}`}
								onClick={() => void handleDismiss(entry)}
							>
								Keep
							</Button>
						</>
					)}
				</div>
			</li>
		);
	};

	// what the last check compared in this twin; nothing when it did not read it, as a twin made since or one it
	// could not open, so the page never says of such a twin that nothing changed
	const compared = lastCheck?.counts?.byTwin?.[twinId];
	const checkedAt = lastCheck?.finishedAt ?? lastCheck?.startedAt;
	const lastChecked =
		lastCheck?.status === "failed"
			? "The last check did not finish."
			: !compared
				? "Not checked yet."
				: checkedAt
					? `Last checked ${when(checkedAt)}.`
					: "";
	// the copies whose original could not be read this time: the check knows nothing new of them
	const unchecked = !compared?.unknown
		? ""
		: compared.unknown < compared.copies
			? `${compared.unknown} of the ${compared.copies} copies here could not be checked this time.`
			: compared.copies === 1
				? "The copy here could not be checked this time."
				: `None of the ${compared.copies} copies here could be checked this time.`;
	const nothingWaits = !compared
		? "Check now to see whether the emails, Teams chats and files this Digital Twin holds a copy of have changed since."
		: compared.copies === 0
			? "A check found nothing here that it can compare. It compares the email conversations, Teams chats and files added from Outlook, Teams and OneDrive."
			: compared.unknown >= compared.copies
				? unchecked
				: `${unchecked ? `${unchecked} ` : ""}Nothing to update in the ${
						compared.copies - compared.unknown === 1
							? "one copy"
							: `${compared.copies - compared.unknown} copies`
					} checked here.`;
	const every = session?.state.settings.twinCheckEveryHours;
	return (
		<div className="flex h-full min-h-0 flex-col overflow-y-auto">
			<div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="pointer-coarse:min-h-11"
					disabled={isChecking}
					onClick={() => void handleCheck()}
				>
					{isChecking ? (
						<Spinner aria-hidden="true" data-icon="inline-start" />
					) : (
						<RefreshCw
							aria-hidden="true"
							data-icon="inline-start"
						/>
					)}
					{isChecking ? "Checking…" : "Check now"}
				</Button>
				{!isChecking && (
					<P className="min-w-0 flex-1 basis-40 text-muted-foreground text-sm">
						{lastChecked}
					</P>
				)}
				{changed.length > 1 && (
					<Button
						type="button"
						size="sm"
						className="ms-auto pointer-coarse:min-h-11"
						disabled={isUpdatingAll || isChecking}
						onClick={() => void handleUpdateAll()}
					>
						{isUpdatingAll && (
							<Spinner
								aria-hidden="true"
								data-icon="inline-start"
							/>
						)}
						{isUpdatingAll
							? "Updating…"
							: `Update all ${changed.length}`}
					</Button>
				)}
			</div>
			{session && every !== undefined && (
				<div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2">
					<P id={`${id}-every`} className="text-sm">
						Check automatically
					</P>
					<Select
						value={String(every)}
						onValueChange={(value) =>
							session.dispatch({
								type: "settings.save",
								changes: { twinCheckEveryHours: Number(value) },
							})
						}
					>
						<SelectTrigger
							aria-labelledby={`${id}-every`}
							className="w-40"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CHECK_CHOICES.map((choice) => (
								<SelectItem
									key={choice.hours}
									value={String(choice.hours)}
								>
									{choice.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<P className="min-w-0 flex-1 basis-56 text-muted-foreground text-sm">
						{every === 0
							? "Off. Your Digital Twins are checked only when you press Check now."
							: "For all your Digital Twins, while Collaboration is open, and while it is closed when background access is on."}
					</P>
				</div>
			)}
			{check && (
				// the check's own step and how far it is, as its job reports them
				<div className="shrink-0 border-b px-4 py-3">
					<output className="block text-sm">
						{(check.step && STEPS[check.step]) ||
							"Checking what changed since you copied it…"}
					</output>
					<Progress
						value={check.progress ?? 0}
						aria-label="How far the check is"
						className="mt-2"
					/>
				</div>
			)}
			{checkError && (
				<Alert variant="destructive" className="m-4 w-auto shrink-0">
					<AlertDescription>
						{checkError.message}
						{checkError.needsSignIn && (
							<Button
								type="button"
								variant="outline"
								className="pointer-coarse:min-h-11"
								onClick={() => void handleSignIn()}
							>
								Sign in to Microsoft 365
							</Button>
						)}
					</AlertDescription>
				</Alert>
			)}
			{!isChecking &&
				!checkError &&
				lastCheck?.status === "failed" &&
				lastCheck.error && (
					<Alert className="m-4 w-auto shrink-0">
						<AlertDescription>{lastCheck.error}</AlertDescription>
					</Alert>
				)}
			{!found ? (
				updates.error ? (
					<Alert variant="destructive" className="m-4 w-auto">
						<AlertDescription>
							{updates.error}
							<Button
								type="button"
								variant="outline"
								className="pointer-coarse:min-h-11"
								onClick={updates.refresh}
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				) : (
					<output className="block p-4 text-muted-foreground text-sm">
						Reading what waits for you…
					</output>
				)
			) : rows.length === 0 ? (
				// while a check runs, its step above says where things stand
				!isChecking && (
					<P className="max-w-prose p-4 text-muted-foreground text-sm">
						{nothingWaits}
					</P>
				)
			) : (
				<>
					{unchecked !== "" && !isChecking && (
						<P className="shrink-0 border-b px-4 py-2 text-muted-foreground text-sm">
							{unchecked}
						</P>
					)}
					<ul aria-label="Suggested updates">
						{rows.map(renderRow)}
					</ul>
				</>
			)}
		</div>
	);
}
