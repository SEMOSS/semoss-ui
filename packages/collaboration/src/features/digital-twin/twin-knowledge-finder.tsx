import { Plus, Search, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
	type ConnectorSavedFile,
	type ConnectorSavedItems,
	ConnectorSavedMark,
	microsoftItemKey,
	saveMicrosoftItem,
} from "@semoss/connectors";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Form,
	FormTextarea,
	P,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import {
	OneDriveIcon,
	OutlookIcon,
	TeamsChatsIcon,
} from "@/components/common/app-icons";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import {
	suggestTwinKnowledge,
	TWIN_SUGGESTION_PROMPT_MAX,
	type TwinSuggestion,
	type TwinSuggestions,
	toMicrosoftItem,
} from "./api/twin-suggestions";
import { TwinKnowledgeSearchScene } from "./twin-knowledge-search-scene";

const finderSchema = z.object({
	prompt: z
		.string()
		.trim()
		.min(1, "Say what your Digital Twin should know.")
		.max(
			TWIN_SUGGESTION_PROMPT_MAX,
			`Keep it to ${TWIN_SUGGESTION_PROMPT_MAX} characters or fewer.`,
		),
});
type FinderValues = z.infer<typeof finderSchema>;

// the kinds in the order they are listed, named as the rest of the page names them, and how each says who it is from
const KINDS = [
	{ kind: "email", label: "Emails", icon: OutlookIcon, by: "From" },
	{
		kind: "chat",
		label: "Teams chats",
		icon: TeamsChatsIcon,
		by: "Message from",
	},
	{
		kind: "file",
		label: "Files",
		icon: OneDriveIcon,
		by: "Last changed by",
	},
] as const;

/** What a suggestion is called where it has no title of its own. */
const nameOf = (suggestion: TwinSuggestion): string =>
	suggestion.title ||
	(suggestion.kind === "chat" ? "Teams chat" : "No subject");

interface TwinKnowledgeFinderProps {
	/** What the owner already put in: its suggestion says so in place of offering it again. */
	savedItems: ConnectorSavedItems;
	/**
	 * Takes an item once it is saved into the page's files, as a viewer hands
	 * one over. The item stays busy until what this returns settles.
	 */
	onSaved: (file: ConnectorSavedFile) => void | Promise<void>;
}

/**
 * Finds what a Digital Twin could know from one description: the server
 * searches the owner's own Outlook, Teams chats and OneDrive for it and lists
 * the emails, chats and files that fit, each with the reason. Nothing is
 * added until the owner adds it, one at a time or all at once; an added item
 * is saved into the page's files the way its own viewer saves it, so the
 * viewers' lists mark it too.
 */
export function TwinKnowledgeFinder({
	savedItems,
	onSaved,
}: TwinKnowledgeFinderProps) {
	const { actions, insightId } = useInsight();
	const id = useId();
	const form = useForm<FinderValues>({
		resolver: zodResolver(finderSchema),
		defaultValues: { prompt: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const [found, setFound] = useState<TwinSuggestions | null>(null);
	const [needsSignIn, setNeedsSignIn] = useState(false);
	const [busyKeys, setBusyKeys] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [isAddingAll, setIsAddingAll] = useState(false);
	// read at once, so a second press before the row redraws does not add an item twice
	const runningKeysRef = useRef(new Set<string>());
	const resultsRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		// a short panel, as the create steps have, would leave the search under its fold
		if (isSubmitting)
			resultsRef.current?.scrollIntoView?.({ block: "nearest" });
	}, [isSubmitting]);

	const handleSubmit = async ({ prompt }: FinderValues): Promise<void> => {
		setNeedsSignIn(false);
		let next: TwinSuggestions;
		try {
			next = await suggestTwinKnowledge(actions, prompt);
		} catch (cause) {
			const reason = cause instanceof Error ? cause.message : "";
			// in place of a reason, a lost Microsoft sign-in names the account to sign in to, as JSON
			const account = tryParseJson(reason);
			const isSignIn =
				isRecord(account) && typeof account.type === "string";
			setNeedsSignIn(isSignIn);
			form.setError("root.server", {
				type: "server",
				message: isSignIn
					? "Sign in to Microsoft 365 to search your Outlook, Teams chats and OneDrive."
					: reason || "The search did not work. Try again.",
			});
			return;
		}
		setFound(next);
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
		void form.handleSubmit(handleSubmit)();
	};
	const add = async (suggestion: TwinSuggestion): Promise<void> => {
		const item = toMicrosoftItem(suggestion);
		const key = microsoftItemKey(item);
		if (runningKeysRef.current.has(key)) return;
		runningKeysRef.current.add(key);
		setBusyKeys((current) => new Set(current).add(key));
		try {
			await onSaved(await saveMicrosoftItem(insightId, item));
		} catch (cause) {
			toast.error(`Could not add "${nameOf(suggestion)}".`, {
				description: cause instanceof Error ? cause.message : undefined,
			});
		} finally {
			runningKeysRef.current.delete(key);
			setBusyKeys((current) => {
				const next = new Set(current);
				next.delete(key);
				return next;
			});
		}
	};

	const suggestions = found?.suggestions ?? [];
	const pending = suggestions.filter(
		(suggestion) =>
			!savedItems.isSaved(microsoftItemKey(toMicrosoftItem(suggestion))),
	);
	const handleAddAll = async (): Promise<void> => {
		setIsAddingAll(true);
		// one after another: one that fails says so and does not keep the rest out
		for (const suggestion of pending) await add(suggestion);
		setIsAddingAll(false);
	};
	const count = `${suggestions.length} ${suggestions.length === 1 ? "suggestion" : "suggestions"}`;
	const groups = KINDS.map((entry) => ({
		...entry,
		rows: suggestions.filter(
			(suggestion) => suggestion.kind === entry.kind,
		),
	})).filter((group) => group.rows.length > 0);

	const renderRow = (
		row: TwinSuggestion,
		by: string,
		index: number,
	): ReactNode => {
		const key = microsoftItemKey(toMicrosoftItem(row));
		const isHeld = savedItems.isSaved(key);
		const isBusy = busyKeys.has(key);
		const name = nameOf(row);
		const when = Number.isNaN(Date.parse(row.date))
			? ""
			: new Date(row.date).toLocaleDateString(undefined, {
					dateStyle: "medium",
				});
		// muted grey drops below 4.5:1 on a held row's fill
		const detailColor = isHeld
			? "text-foreground/75"
			: "text-muted-foreground";
		return (
			<li
				key={key}
				aria-busy={isBusy || undefined}
				className={cn(
					"fade-in-0 slide-in-from-bottom-2 flex min-w-0 animate-in flex-col gap-2 border-b fill-mode-backwards px-4 py-3 duration-500 ease-out motion-reduce:animate-none sm:flex-row sm:items-start sm:gap-4",
					isHeld && "bg-primary/10",
				)}
				// what the search brought back arrives as a list: each row a beat after the one above, the wait capped
				style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
			>
				<div className="min-w-0 flex-1 space-y-0.5">
					<P className="wrap-anywhere font-medium text-sm">{name}</P>
					<P className={cn("wrap-anywhere text-xs", detailColor)}>
						{[row.from && `${by} ${row.from}`, when]
							.filter(Boolean)
							.join(" · ")}
					</P>
					{row.reason && (
						// why it was picked, marked as the search's own words
						<P className="flex gap-1.5 text-sm">
							<Sparkles
								aria-hidden="true"
								className="mt-0.75 size-3.5 shrink-0 text-primary"
							/>
							<span className="wrap-anywhere min-w-0">
								{row.reason}
							</span>
						</P>
					)}
					{row.preview && (
						<P
							className={cn(
								"wrap-anywhere line-clamp-2 text-xs",
								detailColor,
							)}
						>
							{row.preview}
						</P>
					)}
				</div>
				{isHeld ? (
					<span className="flex shrink-0 items-center gap-1.5 font-medium text-xs">
						<ConnectorSavedMark />
						{savedItems.label}
					</span>
				) : (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11 shrink-0 self-start"
						disabled={isBusy || isAddingAll}
						aria-label={`Add ${name}`}
						onClick={() => void add(row)}
					>
						{isBusy ? (
							<Spinner
								aria-hidden="true"
								data-icon="inline-start"
							/>
						) : (
							<Plus aria-hidden="true" data-icon="inline-start" />
						)}
						{isBusy ? "Adding…" : "Add"}
					</Button>
				)}
			</li>
		);
	};

	return (
		// the question scrolls away with what it found, so a short panel, as the create steps have, can give all of itself to the list
		<div className="h-full overflow-y-auto">
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSubmitting}
				className="flex flex-col gap-3 border-b p-4"
			>
				<FormTextarea
					name="prompt"
					label="What should your Digital Twin know?"
					description="Nothing is added until you add it."
					placeholder="Such as: the Apollo migration, its timeline, the vendor contract and the open risks"
					rows={3}
					maxLength={TWIN_SUGGESTION_PROMPT_MAX}
				/>
				{errors.root?.server?.message && (
					<Alert variant="destructive">
						<AlertDescription>
							{errors.root.server.message}
							{needsSignIn && (
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
				<Button
					type="submit"
					disabled={isSubmitting}
					className="pointer-coarse:min-h-11 sm:self-end"
				>
					{isSubmitting ? (
						<Spinner aria-hidden="true" data-icon="inline-start" />
					) : (
						<Search aria-hidden="true" data-icon="inline-start" />
					)}
					{isSubmitting ? "Searching…" : "Find suggestions"}
				</Button>
			</Form>
			<div ref={resultsRef}>
				{/* said as it changes; the scene and the list show it to someone looking */}
				<output className="sr-only">
					{isSubmitting
						? "Searching your Outlook, Teams chats and OneDrive…"
						: found && `Found ${count}.`}
				</output>
				{isSubmitting || !found ? (
					// one scene for the wait and for before it, so the lens stays put when a search starts
					<TwinKnowledgeSearchScene isSearching={isSubmitting} />
				) : (
					<>
						{found.notes.length > 0 && (
							<Alert className="m-4 w-auto">
								<AlertDescription>
									{found.notes.map((note) => (
										<span key={note} className="block">
											{note}
										</span>
									))}
								</AlertDescription>
							</Alert>
						)}
						{suggestions.length === 0 ? (
							<P className="max-w-prose p-4 text-muted-foreground text-sm">
								Nothing that fits was found. Try other words,
								such as a project's name, a person or a subject.
							</P>
						) : (
							<div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
								<P className="text-muted-foreground text-sm">
									{count}. Add the ones your Digital Twin
									should answer from.
								</P>
								{pending.length > 0 && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="pointer-coarse:min-h-11"
										disabled={isAddingAll}
										onClick={() => void handleAddAll()}
									>
										{isAddingAll && (
											<Spinner
												aria-hidden="true"
												data-icon="inline-start"
											/>
										)}
										{isAddingAll
											? "Adding…"
											: `Add all ${pending.length}`}
									</Button>
								)}
							</div>
						)}
						{groups.map(({ kind, label, icon: Icon, by, rows }) => (
							<section
								key={kind}
								aria-labelledby={`${id}-${kind}`}
							>
								<P
									id={`${id}-${kind}`}
									className="flex items-center gap-2 border-b bg-muted/40 px-4 py-1.5 font-medium text-xs"
								>
									<Icon
										aria-hidden="true"
										className="size-4 shrink-0"
									/>
									{label}
									<span className="font-normal text-muted-foreground tabular-nums">
										{rows.length}
									</span>
								</P>
								<ul>
									{rows.map((row, index) =>
										renderRow(row, by, index),
									)}
								</ul>
							</section>
						))}
					</>
				)}
			</div>
		</div>
	);
}
