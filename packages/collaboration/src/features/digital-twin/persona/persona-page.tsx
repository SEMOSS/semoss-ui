import {
	ArrowLeft,
	ArrowRight,
	Fingerprint,
	MessagesSquare,
	Shield,
	SlidersHorizontal,
	Trash2,
	Users,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	H1,
	H2,
	Label,
	P,
	Skeleton,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import {
	personaInterviewPath,
	twinPersonaInterviewPath,
} from "@/lib/workspace-paths";
import { useTwinRead } from "../use-twin-read";
import {
	deleteTwinPersona,
	getTwinPersona,
	type PersonaSections,
	saveTwinPersona,
	setAssistantPersona,
	type TwinPersona,
} from "./api/persona";
import { interviewLink } from "./interview-link";
import { parsePersonaPoints } from "./persona-points";
import { PersonaSectionReader } from "./persona-section-reader";
import "./persona-card.css";

interface PersonaPageProps {
	/**
	 * Opened from Digital Twins: the page leads back there, and so does its
	 * interview. Left out, it is the page the sidebar opens.
	 */
	isFromTwins?: boolean;
}

/**
 * The owner can read and edit their persona, open the interview, and choose
 * whether the assistant uses it when drafting messages.
 */
export function PersonaPage({ isFromTwins = false }: PersonaPageProps) {
	const { actions } = useInsight();
	const read = useTwinRead(getTwinPersona);
	// what a save, a delete or the switch on this page made of it, which is newer than what was read
	const [changed, setChanged] = useState<TwinPersona>();
	const persona = changed ?? read.data;
	const summary = parsePersonaPoints(persona?.sections.short ?? "");
	const [tab, setTab] = useState("persona");
	const personaTab = useRef<HTMLButtonElement>(null);
	const focusPersonaAfterDelete = useRef(false);
	const [isSaving, setIsSaving] = useState(false);
	// A confirmed deletion discards open section drafts.
	const [deletes, setDeletes] = useState(0);
	const deleteId = useId();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const assistantId = useId();
	// where the switch was just put, until the server has answered
	const [wanted, setWanted] = useState<boolean>();
	const [assistantError, setAssistantError] = useState("");
	const interview =
		persona &&
		interviewLink(
			persona,
			isFromTwins ? twinPersonaInterviewPath : personaInterviewPath,
		);

	const handleSave = async (
		sections: Partial<PersonaSections>,
	): Promise<PersonaSections> => {
		setIsSaving(true);
		try {
			const saved = await saveTwinPersona(actions, sections);
			setChanged(saved);
			toast.success("Persona saved");
			return saved.sections;
		} finally {
			setIsSaving(false);
		}
	};
	const handleDelete = async (): Promise<void> => {
		setIsDeleting(true);
		setDeleteError("");
		try {
			setChanged(await deleteTwinPersona(actions));
		} catch (cause) {
			setDeleteError(
				cause instanceof Error
					? cause.message
					: "Your persona could not be deleted.",
			);
			return;
		} finally {
			setIsDeleting(false);
		}
		setDeletes((count) => count + 1);
		focusPersonaAfterDelete.current = true;
		setIsDeleteOpen(false);
		setTab("persona");
		// the switch goes with the persona, and what was said of it with the switch
		setAssistantError("");
		toast.success("Persona deleted");
	};
	const handleAssistantChange = async (isEnabled: boolean): Promise<void> => {
		// one at a time: the switch shows where it was put until that one is answered
		if (wanted !== undefined || isSaving) return;
		setWanted(isEnabled);
		setAssistantError("");
		try {
			const kept = await setAssistantPersona(actions, isEnabled);
			// onto the newest persona, which a save may have replaced meanwhile
			setChanged((current) => {
				const latest = current ?? read.data;
				return latest && { ...latest, assistant: kept };
			});
		} catch (cause) {
			setAssistantError(
				cause instanceof Error
					? cause.message
					: "That could not be saved.",
			);
		} finally {
			setWanted(undefined);
		}
	};

	return (
		<CollaborationPage>
			<div className="@container/persona mx-auto flex w-full max-w-6xl flex-col gap-5">
				{isFromTwins && (
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="-ms-2 pointer-coarse:min-h-11 self-start"
					>
						<Link to="/twins">
							<ArrowLeft
								aria-hidden="true"
								className="rtl:rotate-180"
							/>{" "}
							Digital Twins
						</Link>
					</Button>
				)}
				<header className="flex min-w-0 overflow-hidden rounded-xl border border-assistant/20 bg-assistant/5">
					<div className="flex min-w-0 flex-1 flex-col items-start gap-3 @3xl/persona:p-8 @md/persona:p-6 p-4">
						<H1 className="flex items-center gap-2 font-semibold @lg/persona:text-2xl text-xl tracking-tight">
							<span
								aria-hidden="true"
								className="persona-fingerprint @2xl/persona:hidden h-8 w-7 shrink-0 bg-assistant"
							/>
							Your persona
						</H1>
						{summary.some((point) => point.prefix) ? (
							<ul
								aria-label="Persona summary"
								className="w-full max-w-prose divide-y divide-assistant/20 font-display @lg/persona:text-2xl text-xl leading-snug"
							>
								{summary.map(({ text, offset }) => (
									<li
										key={offset}
										dir="auto"
										className="wrap-anywhere whitespace-pre-line py-2 first:pt-0 last:pb-0"
									>
										{text}
									</li>
								))}
							</ul>
						) : summary.length ? (
							<P
								dir="auto"
								className="wrap-anywhere max-w-prose whitespace-pre-line font-display @4xl/persona:text-3xl @lg/persona:text-2xl text-xl leading-snug"
							>
								{summary[0].text}
							</P>
						) : persona ? (
							<P className="max-w-prose text-foreground/80 leading-relaxed">
								{persona.exists
									? "How you communicate, make decisions, and set boundaries."
									: "A short interview can draft your persona in under ten minutes. You can also write your first section below."}
							</P>
						) : (
							!read.error && <Skeleton className="h-6 w-3/4" />
						)}
						{interview && (
							<Button
								asChild
								variant={
									persona?.exists ? "outline" : "default"
								}
								size="sm"
								className="mt-1 pointer-coarse:min-h-11"
							>
								<Link to={interview.to}>
									<MessagesSquare aria-hidden="true" />
									{interview.label}
								</Link>
							</Button>
						)}
					</div>
					<div
						aria-hidden="true"
						className="persona-print-field @2xl/persona:flex hidden w-1/5 shrink-0 items-center justify-center border-assistant/15 border-s bg-assistant/10 text-assistant/15"
					>
						<span className="persona-fingerprint -rotate-9 @4xl/persona:h-44 h-32 @4xl/persona:w-32 w-24 bg-assistant/75" />
					</div>
				</header>
				{read.error && !persona && (
					<Alert variant="destructive">
						<AlertTitle>Could not load your persona</AlertTitle>
						<AlertDescription>
							{read.error}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={read.reload}
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				)}
				<Tabs
					value={tab}
					onValueChange={setTab}
					className="min-w-0 gap-5"
				>
					<TabsList
						aria-label="Your persona"
						className="min-h-10 pointer-coarse:min-h-12 w-full sm:w-fit"
					>
						<TabsTrigger
							value="persona"
							ref={personaTab}
							disabled={wanted !== undefined || isDeleting}
							className="pointer-coarse:min-h-11 sm:px-4"
						>
							<Fingerprint aria-hidden="true" />
							Persona
						</TabsTrigger>
						<TabsTrigger
							value="usage"
							disabled={!persona}
							className="pointer-coarse:min-h-11 sm:px-4"
						>
							<SlidersHorizontal aria-hidden="true" />
							Usage
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="persona"
						forceMount
						hidden={tab !== "persona"}
						className="space-y-3"
					>
						{persona ? (
							<>
								<PersonaSectionReader
									key={deletes}
									sections={persona.sections}
									onSave={handleSave}
								/>
								<P className="flex max-w-prose items-start gap-2 text-muted-foreground text-sm">
									<Shield
										aria-hidden="true"
										className="mt-0.5 size-4 shrink-0"
									/>
									Only you can open this page. A shared twin
									may quote what you write here.
								</P>
							</>
						) : (
							!read.error && (
								<div className="space-y-4">
									<Skeleton className="h-8 w-40" />
									<Skeleton className="h-64 w-full" />
									<output className="sr-only">
										Loading your persona…
									</output>
								</div>
							)
						)}
					</TabsContent>
					<TabsContent value="usage" className="max-w-3xl space-y-5">
						<H2 className="font-semibold text-xl">
							Where your persona is used
						</H2>
						{persona?.exists ? (
							<>
								<div className="divide-y rounded-xl border bg-card @lg/persona:px-6 px-4">
									<div className="flex items-start gap-3 py-5">
										<Users
											aria-hidden="true"
											className="mt-1 size-5 shrink-0 text-assistant"
										/>
										<div className="min-w-0 space-y-1">
											<P className="font-semibold">
												Digital Twins
											</P>
											<P className="text-muted-foreground text-sm">
												Your twins use your persona by
												default. You can switch it off
												in each twin’s profile.
											</P>
											<Button
												asChild
												variant="link"
												size="sm"
												className="h-auto pointer-coarse:min-h-11 px-0"
											>
												<Link to="/twins">
													Manage twins{" "}
													<ArrowRight
														aria-hidden="true"
														className="size-3.5 rtl:rotate-180"
													/>
												</Link>
											</Button>
										</div>
									</div>
									<div className="flex items-start gap-3 py-5">
										<MessagesSquare
											aria-hidden="true"
											className="mt-1 size-5 shrink-0 text-muted-foreground"
										/>
										<div className="min-w-0 flex-1 space-y-1">
											<Label htmlFor={assistantId}>
												Use my persona when writing for
												me
											</Label>
											<div
												id={`${assistantId}-about`}
												className="space-y-2"
											>
												<P className="text-muted-foreground text-sm">
													Your assistant uses your
													voice and boundaries in
													email and Teams drafts.
												</P>
												{assistantError && (
													<Alert variant="destructive">
														<AlertDescription>
															{assistantError}
														</AlertDescription>
													</Alert>
												)}
											</div>
										</div>
										<Switch
											id={assistantId}
											checked={
												wanted ??
												persona.assistant !== false
											}
											aria-describedby={`${assistantId}-about`}
											aria-disabled={
												wanted !== undefined || isSaving
											}
											className="mt-1 shrink-0"
											onCheckedChange={(enabled) =>
												void handleAssistantChange(
													enabled,
												)
											}
										/>
									</div>
								</div>
								<section
									aria-labelledby={deleteId}
									className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
								>
									<div className="min-w-0 flex-1 basis-60">
										<H2
											id={deleteId}
											className="font-medium text-base"
										>
											Delete your persona
										</H2>
										<P className="text-muted-foreground text-sm">
											Removes your persona from your twins
											and assistant.
										</P>
									</div>
									<Dialog
										open={isDeleteOpen}
										onOpenChange={(isOpen) => {
											if (isDeleting) return;
											setIsDeleteOpen(isOpen);
											if (isOpen) setDeleteError("");
										}}
									>
										<DialogTrigger asChild>
											<Button
												type="button"
												variant="outline"
												disabled={
													isSaving ||
													wanted !== undefined
												}
												className="pointer-coarse:min-h-11 text-destructive"
											>
												<Trash2 aria-hidden="true" />
												Delete persona
											</Button>
										</DialogTrigger>
										<DialogContent
											aria-busy={isDeleting}
											showCloseButton={!isDeleting}
											onCloseAutoFocus={(event) => {
												// On success the trigger disappears with the deleted persona.
												if (
													focusPersonaAfterDelete.current
												) {
													event.preventDefault();
													personaTab.current?.focus();
													focusPersonaAfterDelete.current = false;
												}
											}}
											onEscapeKeyDown={(event) => {
												if (isDeleting)
													event.preventDefault();
											}}
											onInteractOutside={(event) => {
												if (isDeleting)
													event.preventDefault();
											}}
										>
											<DialogHeader>
												<DialogTitle>
													Delete your persona?
												</DialogTitle>
												<DialogDescription>
													Every section of your
													persona is deleted. Your
													Digital Twins stop answering
													in your voice, and your
													assistant stops writing for
													you with it. This cannot be
													undone.
												</DialogDescription>
											</DialogHeader>
											{deleteError && (
												<Alert variant="destructive">
													<AlertDescription>
														{deleteError}
													</AlertDescription>
												</Alert>
											)}
											<DialogFooter>
												<Button
													type="button"
													variant="outline"
													disabled={isDeleting}
													onClick={() =>
														setIsDeleteOpen(false)
													}
												>
													Cancel
												</Button>
												<Button
													type="button"
													variant="destructive"
													disabled={isDeleting}
													onClick={() =>
														void handleDelete()
													}
												>
													{isDeleting
														? "Deleting…"
														: "Delete"}
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</section>
							</>
						) : (
							<P className="text-muted-foreground">
								Write your first section to use your persona
								with your Digital Twins and assistant.
							</P>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</CollaborationPage>
	);
}
