import {
	ArrowLeft,
	ArrowRight,
	AudioLines,
	Brain,
	Mail,
	MessagesSquare,
	Quote,
	Scale,
	ShieldCheck,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	H2,
	P,
	Progress,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { personPhotoUrl } from "@/features/collaboration/api/person-photo";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { givenFirst } from "@/lib/person-name";
import {
	personaInterviewPath,
	personaPath,
	twinPersonaInterviewPath,
	twinPersonaPath,
} from "@/lib/workspace-paths";
import { listTwins } from "../api/digital-twin";
import { TwinBirthScene } from "../twin-birth-scene";
import { type PersonaSections, saveTwinPersona } from "./api/persona";
import { PersonaSectionsForm } from "./persona-sections-form";
import { PersonaSources } from "./persona-sources";
import { PersonaThinking } from "./persona-thinking";
import { ChoiceStep } from "./steps/choice-step";
import { ConfirmStep } from "./steps/confirm-step";
import { DialsStep } from "./steps/dials-step";
import { MirrorStep } from "./steps/mirror-step";
import { ProbeStep } from "./steps/probe-step";
import { RoundsStep } from "./steps/rounds-step";
import { StandsStep } from "./steps/stands-step";
import { usePersonaInterview } from "./use-persona-interview";

// what circles the owner while the server reads how they write, and while it writes their persona
const READING_PARTS = [
	{ id: "mail", icon: <Mail className="size-5" /> },
	{ id: "teams", icon: <MessagesSquare className="size-5" /> },
	{ id: "memory", icon: <Brain className="size-5" /> },
];
const WRITING_PARTS = [
	{ id: "voice", icon: <AudioLines className="size-5" /> },
	{ id: "decide", icon: <Scale className="size-5" /> },
	{ id: "limits", icon: <ShieldCheck className="size-5" /> },
	{ id: "examples", icon: <Quote className="size-5" /> },
];

interface PersonaInterviewProps {
	/**
	 * Opened from Digital Twins: its links go to the persona page under
	 * Digital Twins, and it offers the way back there once it is saved. Left
	 * out, they go to the page the sidebar opens.
	 */
	isFromTwins?: boolean;
}

/**
 * The interview that writes the signed-in person's persona, a step at a
 * time: what it may read, the steps the server asks, a wait while it writes
 * the next one, the persona it wrote to change and save, and then who uses
 * it. Leaving and coming back goes on where it was; nothing changes for
 * their twins or their assistant before the save.
 */
export function PersonaInterview({
	isFromTwins = false,
}: PersonaInterviewProps) {
	const { actions } = useInsight();
	const [params] = useSearchParams();
	const interview = usePersonaInterview(params.get("go") === "more");
	const { view, error } = interview;
	// the door it was opened from is the one it leaves by, and the one it goes on behind
	const personaTo = isFromTwins ? twinPersonaPath() : personaPath();
	const moreTo = isFromTwins
		? twinPersonaInterviewPath("more")
		: personaInterviewPath("more");
	const session = useOptionalCollaborationSession();
	const ownerName =
		givenFirst(
			session?.state.liveProfile?.name?.trim() ||
				session?.state.profile.name.trim() ||
				"",
		) || "You";
	// their own Microsoft photo stands at the centre of the scenes; without one, their initials do
	const ownerEmail = session?.state.liveProfile?.email;
	const ownerPhoto = ownerEmail ? personPhotoUrl(ownerEmail) : undefined;
	// the answer to the step on screen, and which of its rounds is; each belongs to one step
	const [draft, setDraft] = useState<{
		stepId: string;
		answer: Record<string, unknown>;
	}>();
	const [place, setPlace] = useState<{ stepId: string; part: number }>();
	// a step come back to opens at its last round, as one reached going forward opens at its first
	const [isReturning, setIsReturning] = useState(false);
	const [isPastCheckpoint, setIsPastCheckpoint] = useState(false);
	// set by the save: how many of the owner's twins use the persona, or null when that could not be read, and
	// whether their assistant does
	const [saved, setSaved] = useState<{
		using: number | null;
		isAssistantOn: boolean;
	}>();

	// the step stays mounted while its answer is on its way, so nothing typed is lost if it does not get there
	const asking =
		view.phase === "asking"
			? view
			: view.phase === "thinking"
				? view.back
				: null;
	const step = asking?.step;
	const parts = step && "rounds" in step ? step.rounds.length : 1;
	const part =
		step && place?.stepId === step.id
			? place.part
			: isReturning
				? parts - 1
				: 0;
	// what the step opens with: what was put in it on this visit, or what was answered at it before
	const earlier =
		step && draft?.stepId === step.id ? draft.answer : asking?.previous;
	const isAtCheckpoint = asking?.checkpoint === true && !isPastCheckpoint;
	// what the interview has to say of the owner so far, where it has anything
	const told = asking ?? (view.phase === "done" ? view : null);
	// a new step, or the next round of one, starts at its title: each has a title of its own, focused as it arrives
	const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
		node?.focus();
	}, []);

	const handleChange = (answer: Record<string, unknown>): void => {
		if (step) setDraft({ stepId: step.id, answer });
	};
	const handleNext = (): void => {
		if (!step) return;
		if (part < parts - 1) {
			setPlace({ stepId: step.id, part: part + 1 });
			return;
		}
		// the round stays where it is if the answer does not get there
		setPlace({ stepId: step.id, part });
		setIsReturning(false);
		interview.answer({ ...earlier, stepId: step.id }, step.wait);
	};
	const handleBack = (): void => {
		if (!step) return;
		if (part > 0) {
			setPlace({ stepId: step.id, part: part - 1 });
			return;
		}
		setPlace({ stepId: step.id, part: 0 });
		setIsReturning(true);
		interview.back();
	};
	const handleSave = async (
		sections: PersonaSections,
	): Promise<PersonaSections> => {
		const persona = await saveTwinPersona(actions, sections);
		// how many twins use it is good to know and not worth failing a save over
		const using = await listTwins(actions).then(
			({ mine }) =>
				mine.filter((twin) => !persona.offTwins.includes(twin.id))
					.length,
			() => null,
		);
		toast.success("Persona saved");
		setSaved({ using, isAssistantOn: persona.assistant !== false });
		return persona.sections;
	};

	const scene =
		view.phase === "reading" || view.phase === "writing" ? view : null;

	return (
		<CollaborationPage>
			<div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="-ml-2 mb-2 pointer-coarse:min-h-11 self-start"
				>
					<Link to={personaTo}>
						<ArrowLeft aria-hidden="true" />
						Your persona
					</Link>
				</Button>
				{saved ? (
					<TwinBirthScene
						name={ownerName}
						image={ownerPhoto}
						steps={[]}
						parts={WRITING_PARTS.map((entry) => ({
							...entry,
							isLanded: true,
						}))}
						headline={{ working: "", ready: "Meet your persona" }}
					>
						<div className="flex w-full flex-col items-center gap-5">
							<div className="flex flex-col gap-1">
								<P className="text-muted-foreground text-sm">
									{saved.using === null
										? "Your Digital Twins answer this way from their next chat."
										: saved.using === 0
											? "The next Digital Twin you create will answer this way."
											: saved.using === 1
												? "It now shapes how your Digital Twin answers."
												: `It now shapes how ${saved.using} of your Digital Twins answer.`}
								</P>
								{saved.isAssistantOn && (
									<P className="text-muted-foreground text-sm">
										Your assistant writes email and Teams
										messages for you this way too.
									</P>
								)}
							</div>
							<div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
								<Button
									asChild
									variant={
										isFromTwins ? "outline" : "default"
									}
									className="pointer-coarse:min-h-11"
								>
									<Link to={personaTo}>
										Open your persona
									</Link>
								</Button>
								{isFromTwins && (
									<Button
										asChild
										className="pointer-coarse:min-h-11"
									>
										<Link to="/twins">
											Back to Digital Twins
										</Link>
									</Button>
								)}
							</div>
						</div>
					</TwinBirthScene>
				) : scene ? (
					<TwinBirthScene
						name={ownerName}
						image={ownerPhoto}
						steps={[
							{
								id: "now",
								label:
									scene.job.step &&
									scene.job.step !== "queued"
										? scene.job.step
										: "Waiting for its turn",
								state: "active",
							},
						]}
						parts={(scene.phase === "reading"
							? READING_PARTS
							: WRITING_PARTS
						).map((entry) => ({ ...entry, isLanded: false }))}
						headline={{
							working:
								scene.phase === "reading"
									? "Reading how you write"
									: "Writing your persona",
							ready: "",
						}}
					>
						{null}
					</TwinBirthScene>
				) : (
					<>
						<CollaborationPageHeader
							className="mb-6"
							title="Build your persona"
							description="A few steps on how you sound, how you decide and what you keep for yourself. Every Digital Twin you created then answers the way you would, and your assistant writes for you the way you would."
							actions={
								(asking || view.phase === "done") && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="pointer-coarse:min-h-11"
										onClick={interview.startOver}
									>
										Start over
									</Button>
								)
							}
						/>
						{view.phase === "loading" && (
							<div className="flex flex-col gap-4">
								<Skeleton className="h-10 w-2/3" />
								<Skeleton className="h-64 w-full" />
								<output className="sr-only">
									Loading your interview…
								</output>
							</div>
						)}
						{view.phase === "problem" && (
							<Alert variant="destructive">
								<AlertTitle>
									The interview could not be opened
								</AlertTitle>
								<AlertDescription>
									{error}
									<div className="flex flex-wrap gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={interview.reload}
										>
											Try again
										</Button>
										<Button asChild variant="outline">
											<Link to={personaTo}>
												Write it by hand
											</Link>
										</Button>
									</div>
								</AlertDescription>
							</Alert>
						)}
						{view.phase === "none" && (
							<PersonaSources
								onStart={(sources) => {
									// nothing put in or passed in the interview before this one carries over
									setDraft(undefined);
									setPlace(undefined);
									setIsReturning(false);
									setIsPastCheckpoint(false);
									interview.start(sources);
								}}
							/>
						)}
						{view.phase === "unwritten" && (
							<Alert variant="destructive">
								<AlertTitle>
									Your persona could not be written
								</AlertTitle>
								<AlertDescription>
									{view.reason} Your answers are all kept.
									<Button
										type="button"
										variant="outline"
										onClick={interview.reload}
									>
										Try again
									</Button>
								</AlertDescription>
							</Alert>
						)}
						{view.phase === "thinking" && (
							<PersonaThinking line={view.line} />
						)}
						{asking && step && (
							<div
								hidden={view.phase === "thinking"}
								className={
									view.phase === "thinking"
										? "hidden"
										: "flex min-w-0 flex-col gap-6"
								}
							>
								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between gap-4 text-muted-foreground text-sm">
										<span>
											Step {asking.progress.answered + 1}{" "}
											of {asking.progress.of}
											{parts > 1 &&
												`, part ${part + 1} of ${parts}`}
										</span>
										{asking.canWrap && !isAtCheckpoint && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="pointer-coarse:min-h-11"
												onClick={interview.wrapUp}
											>
												Wrap up
											</Button>
										)}
									</div>
									<Progress
										aria-label="How far the interview is"
										value={asking.progress.answered}
										max={asking.progress.of}
									/>
								</div>
								{/* said once, where the interview starts: what it could not read */}
								{asking.notes.length > 0 &&
									asking.progress.answered === 0 && (
										<Alert>
											<AlertDescription>
												<ul className="flex list-disc flex-col gap-1 ps-4">
													{asking.notes.map(
														(note) => (
															<li key={note}>
																{note}
															</li>
														),
													)}
												</ul>
											</AlertDescription>
										</Alert>
									)}
								{isAtCheckpoint ? (
									<div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6">
										<H2
											ref={focusHeading}
											tabIndex={-1}
											className="rounded-sm font-medium text-xl leading-snug focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
										>
											That is a solid start
										</H2>
										<P className="max-w-prose text-muted-foreground text-sm">
											I know how you sound and what to
											leave to you. About five more
											minutes cover how you decide, the
											questions you always get and what
											you check in other people's work. Or
											wrap up now, and come back for those
											whenever you like.
										</P>
										<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
											{asking.canBack && (
												<Button
													type="button"
													variant="ghost"
													className="pointer-coarse:min-h-11 sm:me-auto"
													onClick={handleBack}
												>
													<ArrowLeft aria-hidden="true" />
													Back
												</Button>
											)}
											<Button
												type="button"
												variant="outline"
												className="pointer-coarse:min-h-11"
												onClick={interview.wrapUp}
											>
												Wrap up
											</Button>
											<Button
												type="button"
												className="pointer-coarse:min-h-11"
												onClick={() =>
													setIsPastCheckpoint(true)
												}
											>
												Keep going
												<ArrowRight aria-hidden="true" />
											</Button>
										</div>
									</div>
								) : (
									<section
										key={step.id}
										aria-labelledby={`step-${step.id}`}
										className="fade-in-0 motion-safe:slide-in-from-end-6 flex min-w-0 animate-in flex-col gap-6 duration-300 ease-out"
									>
										<div className="flex flex-col gap-1">
											<H2
												key={part}
												id={`step-${step.id}`}
												ref={focusHeading}
												tabIndex={-1}
												className="rounded-sm font-medium text-xl leading-snug focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
											>
												{step.title}
											</H2>
											<P className="max-w-prose text-muted-foreground text-sm">
												{step.detail}
											</P>
										</div>
										{step.kind === "confirm" && (
											<ConfirmStep
												step={step}
												initial={earlier}
												onChange={handleChange}
											/>
										)}
										{step.kind === "dials" && (
											<DialsStep
												step={step}
												initial={earlier}
												onChange={handleChange}
											/>
										)}
										{step.kind === "rounds" && (
											<RoundsStep
												step={step}
												initial={earlier}
												part={part}
												onChange={handleChange}
											/>
										)}
										{step.kind === "choice" && (
											<ChoiceStep
												step={step}
												initial={earlier}
												onChange={handleChange}
											/>
										)}
										{step.kind === "stands" && (
											<StandsStep
												step={step}
												initial={earlier}
												onChange={handleChange}
											/>
										)}
										{step.kind === "probe" && (
											<ProbeStep
												step={step}
												initial={earlier}
												onChange={handleChange}
											/>
										)}
										{step.kind === "mirror" && (
											<MirrorStep
												step={step}
												initial={earlier}
												part={part}
												onChange={handleChange}
												onRewrite={(
													roundId,
													flagged,
													note,
												) =>
													interview.answer(
														{
															stepId: step.id,
															retry: roundId,
															flagged,
															note,
														},
														"Writing that one again",
													)
												}
											/>
										)}
										{error && (
											<Alert variant="destructive">
												<AlertDescription>
													{error}
												</AlertDescription>
											</Alert>
										)}
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											{/* one way back: to the round before in a step that has rounds, else to the step before */}
											{part > 0 || asking.canBack ? (
												<Button
													type="button"
													variant="ghost"
													className="pointer-coarse:min-h-11"
													onClick={handleBack}
												>
													<ArrowLeft aria-hidden="true" />
													Back
												</Button>
											) : (
												<span />
											)}
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
												{parts === 1 && (
													<Button
														type="button"
														variant="ghost"
														className="pointer-coarse:min-h-11"
														onClick={() => {
															setIsReturning(
																false,
															);
															interview.answer(
																{
																	stepId: step.id,
																	skipped: true,
																},
																step.wait,
															);
														}}
													>
														Skip
													</Button>
												)}
												<Button
													type="button"
													className="pointer-coarse:min-h-11"
													onClick={handleNext}
												>
													Next
													<ArrowRight aria-hidden="true" />
												</Button>
											</div>
										</div>
									</section>
								)}
							</div>
						)}
						{view.phase === "done" && (
							<div className="flex min-w-0 flex-col gap-6">
								<div className="flex flex-col gap-1">
									<H2 className="font-medium text-xl leading-snug">
										Here is what I wrote
									</H2>
									<P className="max-w-prose text-muted-foreground text-sm">
										Change anything that is not you, then
										save. The people you share a twin with
										cannot open this, but a twin can be
										talked into quoting what it was told:
										leave nothing here that you would not
										say to them.
									</P>
								</div>
								{view.notes.length > 0 && (
									<Alert>
										<AlertDescription>
											<ul className="flex list-disc flex-col gap-1 ps-4">
												{view.notes.map((note) => (
													<li key={note}>{note}</li>
												))}
											</ul>
										</AlertDescription>
									</Alert>
								)}
								<PersonaSectionsForm
									sections={view.brief.sections}
									submitLabel="Save my persona"
									onSave={handleSave}
								>
									<Button
										asChild
										variant="outline"
										className="pointer-coarse:min-h-11"
									>
										<Link to={moreTo}>
											Keep grilling me
										</Link>
									</Button>
								</PersonaSectionsForm>
							</div>
						)}
						{told && told.learned.length > 0 && (
							<div
								aria-live="polite"
								className="mt-8 flex min-w-0 flex-col gap-2 border-t pt-4"
							>
								<span className="text-muted-foreground text-xs">
									Learned so far
								</span>
								<ul className="flex min-w-0 flex-wrap gap-1.5">
									{told.learned.map((trait) => (
										<li
											key={trait}
											className="wrap-anywhere fade-in-0 zoom-in-95 animate-in rounded-full border bg-card px-2.5 py-0.5 text-xs duration-300"
										>
											{trait}
										</li>
									))}
								</ul>
							</div>
						)}
					</>
				)}
			</div>
		</CollaborationPage>
	);
}
