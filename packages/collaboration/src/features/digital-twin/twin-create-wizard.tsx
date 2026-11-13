import {
	ArrowLeft,
	ArrowRight,
	Check,
	FolderOpen,
	ImageIcon,
	Library,
	type LucideIcon,
	MessageSquareText,
	Sparkles,
	UserRound,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Form,
	H2,
	P,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { sleep } from "@semoss/utility/async";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import { twinChatPath, twinContentsPath } from "@/lib/workspace-paths";
import {
	addTwinKnowledge,
	createTwin,
	saveTwin,
	type TwinProfile,
	TwinSetupError,
	type TwinSetupStep,
	type TwinSource,
	twinSetupSteps,
} from "./api/digital-twin";
import { TwinBirthScene } from "./twin-birth-scene";
import { TwinKnowledgeStep } from "./twin-knowledge-step";
import { TwinProfileFields } from "./twin-profile-fields";
import { newTwinProfile, twinProfileSchema } from "./twin-profile-schema";
import { describeTwinSources, twinSourceKind } from "./twin-sources";
import { useImagePreview } from "./use-image-preview";

// one decision at a time: who it is, how it answers, what it can use, what it knows, then a look at all of it
const STEPS = [
	{
		id: "identity",
		label: "Identity",
		title: "Who is your Digital Twin?",
		description:
			"Give it a name and a face. People see both when they chat with it.",
		fields: ["image", "name"],
	},
	{
		id: "voice",
		label: "Voice",
		title: "How should it answer?",
		description:
			"Its instructions start from a version that keeps it honest about being an AI and about where its answers come from. Change what you like.",
		fields: ["instructions", "greeting"],
	},
	{
		id: "abilities",
		label: "Abilities",
		title: "What else can it use?",
		description:
			"Optional. Skills shape how it works and toolboxes reach other systems. You can add either later.",
		fields: ["skills", "toolboxes"],
	},
	{
		id: "knowledge",
		label: "Knowledge",
		title: "What should it know?",
		description:
			"Choose the emails, Teams chats and files it answers from. Copies of them go into your Digital Twin when it is created, where the people you share it with can open them. You can also skip this and add them later.",
		fields: [],
	},
	{
		id: "review",
		label: "Review",
		title: "Ready to bring it to life?",
		description:
			"This is what you chose. Your Digital Twin stays private until you name the people who can chat with it.",
		fields: [],
	},
] as const;
const LAST_STEP = STEPS.length - 1;
const KNOWLEDGE_STEP = STEPS.findIndex((entry) => entry.id === "knowledge");

// how the scene names what the server is doing; "finish" is a second try at a twin that already exists
const SETUP: Record<
	TwinSetupStep | "finish",
	{ label: string; icon: LucideIcon }
> = {
	twin: { label: "Create your Digital Twin", icon: UserRound },
	folder: { label: "Make room for what it knows", icon: FolderOpen },
	greeting: { label: "Save its greeting", icon: MessageSquareText },
	image: { label: "Upload its image", icon: ImageIcon },
	knowledge: { label: "Add what you chose", icon: Library },
	finish: { label: "Finish setting it up", icon: Sparkles },
};
// with motion on, each server step stays up at least this long, so its part is seen to land
const STEP_PAUSE_MS = 700;
// the orbit has room for this many chosen items beside the steps; the count says how the rest are doing
const MAX_ORBITING_ITEMS = 8;

interface TwinCreateWizardProps {
	/** The owner as a new twin's instructions name them. */
	ownerName: string;
	/** The owner's skill catalog; the twin can follow any of them. */
	skills: CatalogSkill[];
	/** Called when the owner goes on from the new twin to its own page. */
	onOpenSettings: () => void;
}

/**
 * Creating a Digital Twin, a step at a time: who it is, how it answers, what
 * it can use, what it knows, a review, then the twin being made and what to do
 * with it next. Nothing is created before the review's Create; what the owner
 * chose for it to know waits in the page's files until then. A create that
 * makes the twin and then fails says which part, keeps what was entered, and
 * finishes on the next try instead of creating a second twin, which the server
 * refuses, or copying anything twice.
 */
export function TwinCreateWizard({
	ownerName,
	skills,
	onOpenSettings,
}: TwinCreateWizardProps) {
	const { actions } = useInsight();
	const id = useId();
	const form = useForm<TwinProfile>({
		resolver: zodResolver(twinProfileSchema),
		defaultValues: newTwinProfile(ownerName),
	});
	const { errors, isSubmitting } = form.formState;
	const values = form.watch();
	const preview = useImagePreview(values.image);
	const [step, setStep] = useState(0);
	// the furthest step opened: the knowledge step reads the owner's mailbox, so it waits until it is asked for
	const [reached, setReached] = useState(0);
	// which way the last move went, for the step's entrance; none until the owner moves, so the page does not open on one
	const [travel, setTravel] = useState<"none" | "forward" | "back">("none");
	// what the owner chose for the twin to know, and which of it a create has already copied in
	const [knowledge, setKnowledge] = useState<
		{ source: TwinSource; isCopied: boolean }[]
	>([]);
	// set by a create that made the twin, even one whose later steps failed
	const [twinId, setTwinId] = useState<string>();
	// what the server is doing, and how far it is, while the twin is made; null while the steps show
	const [setup, setSetup] = useState<{
		steps: (TwinSetupStep | "finish")[];
		done: number;
	} | null>(null);
	const headings = useRef<(HTMLHeadingElement | null)[]>([]);
	useEffect(() => {
		// a new step, or the review again after a create that failed, starts at its title
		if (travel !== "none" && !setup) headings.current[step]?.focus();
	}, [step, setup, travel]);

	const goTo = (next: number): void => {
		setTravel(next < step ? "back" : "forward");
		setReached((furthest) => Math.max(furthest, next));
		setStep(next);
	};
	const handleSubmit = async (profile: TwinProfile): Promise<void> => {
		if (step < LAST_STEP) {
			goTo(step + 1);
			return;
		}
		// no wait is added for someone who asked for less motion, or where that cannot be told
		const pause =
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ===
			false
				? STEP_PAUSE_MS
				: 0;
		const pending = knowledge
			.filter((item) => !item.isCopied)
			.map((item) => item.source);
		const handleCopied = (source: TwinSource): Promise<void> => {
			setKnowledge((current) =>
				current.map((item) =>
					item.source.path === source.path
						? { ...item, isCopied: true }
						: item,
				),
			);
			// each one is seen to land, without a long list taking long
			return sleep(pause / 2);
		};
		let madeId = twinId;
		try {
			if (madeId) {
				setSetup({
					steps: pending.length
						? ["finish", "knowledge"]
						: ["finish"],
					done: 0,
				});
				await Promise.all([
					saveTwin(actions, madeId, profile),
					sleep(pause),
				]);
				if (pending.length) {
					setSetup((current) => current && { ...current, done: 1 });
					await addTwinKnowledge(
						actions,
						madeId,
						pending,
						handleCopied,
					).catch((cause: unknown) => {
						throw new Error(
							`Not everything you chose could be added: ${cause instanceof Error ? cause.message : "that did not work."}`,
							{ cause },
						);
					});
				}
			} else {
				const steps = twinSetupSteps(profile, pending);
				madeId = await createTwin(actions, profile, {
					knowledge: pending,
					onStep: (current) => {
						setSetup({ steps, done: steps.indexOf(current) });
						return sleep(pause);
					},
					onCopied: handleCopied,
				});
			}
		} catch (cause) {
			// the twin exists now, and the server refuses a second one: the next try finishes this one
			if (cause instanceof TwinSetupError) setTwinId(cause.twinId);
			setSetup(null);
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "Your Digital Twin could not be created.",
			});
			return;
		}
		setTwinId(madeId);
		setSetup(
			(current) => current && { ...current, done: current.steps.length },
		);
	};
	// a problem on a step the owner is not looking at would leave the button doing nothing
	const handleInvalid = (
		invalid: Partial<Record<keyof TwinProfile, unknown>>,
	): void => {
		const first = STEPS.findIndex((entry) =>
			entry.fields.some((field) => field in invalid),
		);
		if (first >= 0 && first !== step) goTo(first);
	};

	const name = values.name.trim() || "Your Digital Twin";
	const copied = knowledge.filter((item) => item.isCopied).length;
	const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
	const summary = [
		{
			term: "Name and image",
			step: 0,
			value: (
				<span className="flex min-w-0 items-center gap-3">
					<AgentAvatar agent={{ name, avatar: preview }} size="md" />
					<span className="wrap-anywhere min-w-0">{name}</span>
				</span>
			),
		},
		{
			term: "Instructions",
			step: 1,
			value: (
				<span className="line-clamp-3 whitespace-pre-line">
					{values.instructions.trim() || "None"}
				</span>
			),
		},
		{
			term: "Greeting",
			step: 1,
			value: (
				<span className="line-clamp-3 whitespace-pre-line">
					{values.greeting.trim() ||
						"None. People start the chat themselves."}
				</span>
			),
		},
		{
			term: "Skills and toolboxes",
			step: 2,
			value:
				[
					...values.skills.map(
						(skillId) => skillNames.get(skillId) ?? skillId,
					),
					...values.toolboxes.map((toolbox) => toolbox.name),
				].join(", ") || "None",
		},
		{
			term: "What it knows",
			step: KNOWLEDGE_STEP,
			value:
				describeTwinSources(knowledge.map((item) => item.source)) ||
				"Nothing yet. You can add it once your Digital Twin is created.",
		},
	];
	// where to go from the new twin, the thing it needs next last, as the one to press
	const share = {
		to: "/twins/mine?tab=people",
		label: "Share it with people",
		onClick: onOpenSettings,
	};
	const nextMoves: { to: string; label: string; onClick?: () => void }[] = [
		{ to: twinChatPath(twinId ?? ""), label: "Chat with it" },
		...(copied > 0
			? [{ to: twinContentsPath(), label: "Add to what it knows" }, share]
			: [
					share,
					{ to: twinContentsPath(), label: "Choose what it knows" },
				]),
	];
	// one step of the flow: its title, which takes focus when the step opens, then what the step holds
	const renderStep = (index: number, content: ReactNode) => {
		const entry = STEPS[index];
		return (
			entry && (
				<section
					key={entry.id}
					hidden={index !== step}
					aria-labelledby={`${id}-${entry.id}`}
					className={cn(
						"min-w-0 flex-col gap-6",
						index === step ? "flex" : "hidden",
						// the step arrives from the side the owner is heading to; with less motion asked for it only fades
						travel !== "none" &&
							"fade-in-0 animate-in duration-300 ease-out",
						travel === "forward" &&
							"motion-safe:slide-in-from-end-6",
						travel === "back" &&
							"motion-safe:slide-in-from-start-6",
					)}
				>
					<div className="space-y-1">
						<H2
							id={`${id}-${entry.id}`}
							ref={(node) => {
								headings.current[index] = node;
							}}
							tabIndex={-1}
							className="rounded-sm font-medium text-xl leading-snug focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
						>
							{entry.title}
						</H2>
						<P className="max-w-prose text-muted-foreground text-sm">
							{entry.description}
						</P>
					</div>
					{content}
				</section>
			)
		);
	};
	return (
		<>
			{setup && (
				<TwinBirthScene
					name={name}
					image={preview}
					steps={setup.steps.map((entry, index) => ({
						id: entry,
						label:
							entry === "knowledge"
								? `${SETUP[entry].label} (${copied} of ${knowledge.length})`
								: SETUP[entry].label,
						state:
							index < setup.done
								? "done"
								: index === setup.done
									? "active"
									: "todo",
					}))}
					parts={[
						...setup.steps.flatMap((entry, index) => {
							// what the owner chose circles as itself, below, rather than as one mark for all of it
							if (entry === "knowledge") return [];
							const Icon = SETUP[entry].icon;
							return [
								{
									id: entry,
									icon: <Icon className="size-5" />,
									isLanded: index < setup.done,
								},
							];
						}),
						...knowledge
							.slice(0, MAX_ORBITING_ITEMS)
							.map(({ source, isCopied }) => {
								const Icon = twinSourceKind(source).icon;
								return {
									id: source.path,
									icon: <Icon className="size-5" />,
									isLanded: isCopied,
								};
							}),
					]}
				>
					<div className="fade-in-0 slide-in-from-bottom-2 flex w-full animate-in flex-col items-center gap-5 fill-mode-backwards delay-300 duration-500 ease-out">
						<P className="text-muted-foreground text-sm">
							{copied > 0
								? "It is private, and it knows what you chose. Name the people who can ask it, or give it more to answer from."
								: "It is private, and it knows nothing yet. Choose what it can answer from, then name the people who can ask it."}
						</P>
						<div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
							{nextMoves.map((move, index) => (
								<Button
									key={move.label}
									asChild
									variant={
										index === nextMoves.length - 1
											? "default"
											: "outline"
									}
									className="pointer-coarse:min-h-11"
								>
									<Link to={move.to} onClick={move.onClick}>
										{move.label}
									</Link>
								</Button>
							))}
						</div>
					</div>
				</TwinBirthScene>
			)}
			{/* still mounted behind the scene, so a create that fails comes back to everything as it was left */}
			<div
				hidden={setup !== null}
				className={cn(
					"min-w-0 flex-col gap-6",
					// the places to pick from need the room; the short steps read better narrow
					step === KNOWLEDGE_STEP ? "max-w-5xl" : "max-w-3xl",
					setup ? "hidden" : "flex",
				)}
			>
				<CollaborationPageHeader
					className="mb-0"
					title={
						<span className="flex min-w-0 items-center gap-4">
							{/* the portrait leaves the first step with the owner and stays in sight from there on */}
							{step > 0 && (
								<span className="zoom-in-50 fade-in-0 flex animate-in duration-300 ease-out motion-reduce:animate-none">
									<AgentAvatar
										agent={{ name, avatar: preview }}
										size="lg"
									/>
								</span>
							)}
							<span className="min-w-0">
								Create your Digital Twin
							</span>
						</span>
					}
					description="An AI that answers questions about you from the emails, Teams chats and files you copy into it. Only the people you name can chat with it, and you can have one."
				/>
				<ol
					aria-label="Steps to create your Digital Twin"
					className="flex items-center gap-2"
				>
					{STEPS.map((entry, index) => (
						<li
							key={entry.id}
							aria-current={index === step ? "step" : undefined}
							className="flex min-w-0 flex-1 items-center gap-2 last:flex-none"
						>
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-full border font-medium text-xs tabular-nums transition-colors duration-300",
									index < step &&
										"border-primary bg-primary text-primary-foreground",
									index === step &&
										"border-primary text-primary",
									index > step && "text-muted-foreground",
								)}
							>
								{index < step ? (
									<Check
										className="size-3.5"
										aria-hidden="true"
									/>
								) : (
									index + 1
								)}
							</span>
							{/* a narrow screen has room for the numbers only; the step's own title says the rest */}
							<span
								className={cn(
									"sr-only truncate text-sm md:not-sr-only",
									index === step
										? "font-medium"
										: "text-muted-foreground",
								)}
							>
								{entry.label}
								{index < step && (
									<span className="sr-only"> (done)</span>
								)}
							</span>
							{index < LAST_STEP && (
								<span
									aria-hidden="true"
									className="relative h-px min-w-3 flex-1 overflow-hidden bg-border"
								>
									<span
										className={cn(
											"absolute inset-0 origin-left bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none",
											index < step
												? "scale-x-100"
												: "scale-x-0",
										)}
									/>
								</span>
							)}
						</li>
					))}
				</ol>
				{/* a card around every step and the buttons under them */}
				<div className="flex min-w-0 flex-col gap-6 overflow-hidden rounded-xl border bg-card p-4 sm:p-6">
					{/* above the step, not by the buttons: a create that fails comes back at the step's title, and a long review would leave the reason below the fold */}
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
								{twinId &&
									" Everything you entered is still here: finish setting it up to try that part again."}
							</AlertDescription>
						</Alert>
					)}
					{/* a step stays mounted once opened, so a chosen image file and a half-typed answer survive moving between them */}
					<Form
						id={`${id}-form`}
						form={form}
						onSubmit={handleSubmit}
						onError={handleInvalid}
						noValidate
						aria-busy={isSubmitting}
						// no box of its own: the step on screen sits in the card directly
						className="contents"
					>
						{STEPS.map((entry, index) =>
							entry.id === "knowledge"
								? null
								: renderStep(
										index,
										entry.id === "review" ? (
											<dl className="divide-y rounded-lg border">
												{summary.map(
													({
														term,
														step: target,
														value,
													}) => (
														<div
															key={term}
															className="p-3 sm:p-4"
														>
															<dt className="text-muted-foreground text-xs">
																{term}
															</dt>
															<dd className="mt-1 flex min-w-0 items-start gap-3 text-sm">
																<span className="wrap-anywhere min-w-0 flex-1">
																	{value}
																</span>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="pointer-coarse:min-h-11 shrink-0"
																	aria-label={`Change ${term.toLowerCase()}`}
																	onClick={() =>
																		goTo(
																			target,
																		)
																	}
																>
																	Change
																</Button>
															</dd>
														</div>
													),
												)}
											</dl>
										) : (
											<TwinProfileFields
												group={entry.id}
												skills={skills}
											/>
										),
									),
						)}
					</Form>
					{/* outside the form: a viewer's own buttons and search fields must not submit it */}
					{renderStep(
						KNOWLEDGE_STEP,
						reached >= KNOWLEDGE_STEP && (
							<TwinKnowledgeStep
								// what a create already copied in is the twin's by now, not a choice to take back
								items={knowledge
									.filter((item) => !item.isCopied)
									.map((item) => item.source)}
								onAdd={(source) =>
									setKnowledge((current) => [
										...current,
										{ source, isCopied: false },
									])
								}
								onRemove={(source) =>
									setKnowledge((current) =>
										current.filter(
											(item) =>
												item.source.path !==
												source.path,
										),
									)
								}
							/>
						),
					)}
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						{step > 0 ? (
							<Button
								type="button"
								variant="ghost"
								className="pointer-coarse:min-h-11"
								disabled={isSubmitting}
								onClick={() => goTo(step - 1)}
							>
								<ArrowLeft aria-hidden="true" />
								Back
							</Button>
						) : (
							<Button
								asChild
								variant="ghost"
								className="pointer-coarse:min-h-11"
							>
								<Link to="/twins">Cancel</Link>
							</Button>
						)}
						<Button
							type="submit"
							form={`${id}-form`}
							className="pointer-coarse:min-h-11"
							disabled={isSubmitting}
						>
							{step < LAST_STEP ? (
								<>
									Next: {STEPS[step + 1]?.label}
									<ArrowRight aria-hidden="true" />
								</>
							) : twinId ? (
								"Finish setting up"
							) : (
								"Create Digital Twin"
							)}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
