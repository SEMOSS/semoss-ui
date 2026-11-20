import {
	ArrowLeft,
	BookOpenText,
	MessageCircle,
	SlidersHorizontal,
	Trash2,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useSearchParams } from "react-router";
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
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useSkillCatalog } from "@/features/routines/use-skill-catalog";
import { givenFirst } from "@/lib/person-name";
import type { InsightActions } from "@/lib/pixel";
import { twinChatPath, twinContentsPath } from "@/lib/workspace-paths";
import { deleteTwin, getMyTwinAgent, readTwinNote } from "./api/digital-twin";
import { getTwinPersona } from "./persona/api/persona";
import { TwinCreateWizard } from "./twin-create-wizard";
import { TwinPageCover } from "./twin-page-cover";
import { TwinPeople } from "./twin-people";
import { TwinProfileForm, type TwinSaveControl } from "./twin-profile-form";
import { useTwinIndex } from "./use-twin-index";
import { useTwinRead } from "./use-twin-read";

/**
 * Create a Digital Twin with `?create=true`, or manage the one named by
 * `?twinId=...`. `tab=people` opens its sharing settings.
 */
export function TwinSettings() {
	const { actions } = useInsight();
	const { state } = useCollaborationSession();
	const navigate = useNavigate();
	const [params, setParams] = useSearchParams();
	const requestedTwinId = params.get("twinId") ?? undefined;
	const isCreating =
		params.get("create") === "true" && requestedTwinId === undefined;
	const readTwin = useCallback(
		async (actions: InsightActions) => {
			const [agent, persona] = await Promise.all([
				isCreating ? null : getMyTwinAgent(actions, requestedTwinId),
				// a persona that cannot be read is left as it is: null, and no switch for it is shown
				getTwinPersona(actions).catch(() => null),
			]);
			if (!agent) return { agent: null, about: null, persona };
			// a note that cannot be read is left as it is, not taken for none: null, and the form locks it
			const about = await readTwinNote(actions, agent.workspace_id).catch(
				() => null,
			);
			return { agent, about, persona };
		},
		[isCreating, requestedTwinId],
	);
	const twin = useTwinRead(readTwin);
	const catalog = useSkillCatalog();
	// undefined until it is read, null for someone with no twin
	const agent = twin.data?.agent;
	const about = twin.data?.about ?? null;
	const persona = twin.data?.persona ?? null;
	const hasPersona = persona?.exists === true;
	// a changed note is described for the twin's chats a moment after it is saved
	const requestIndex = useTwinIndex(agent?.workspace_id);
	// the browser keeps the image it has for an address, so a new upload gets a new one
	const [imageRevision, setImageRevision] = useState(0);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	const [savedName, setSavedName] = useState<string>();
	const saveControl = useRef<TwinSaveControl>(null);
	const [leaveError, setLeaveError] = useState("");
	const keepEditing = useRef<HTMLButtonElement>(null);
	const previousFocus = useRef<HTMLElement>(null);
	const blocker = useBlocker(({ currentLocation, nextLocation }) => {
		if (isDeleting || !saveControl.current?.hasUnsavedChanges())
			return false;
		const current = new URLSearchParams(currentLocation.search);
		const next = new URLSearchParams(nextLocation.search);
		return (
			currentLocation.pathname !== nextLocation.pathname ||
			current.get("twinId") !== next.get("twinId") ||
			current.get("create") !== next.get("create")
		);
	});
	useEffect(() => {
		if (blocker.state !== "blocked") return;
		let active = true;
		const flush = saveControl.current?.flush() ?? Promise.resolve();
		void flush.then(
			() => {
				if (active) blocker.proceed();
			},
			(error: unknown) => {
				if (active)
					setLeaveError(
						error instanceof Error
							? error.message
							: "Your changes could not be saved.",
					);
			},
		);
		return () => {
			active = false;
		};
	}, [blocker]);

	const handleSaved = (
		name: string,
		noteChanged: boolean,
		imageChanged: boolean,
	): void => {
		setSavedName(name);
		if (noteChanged) requestIndex();
		if (imageChanged) setImageRevision((revision) => revision + 1);
	};
	const handleDelete = async (twinId: string): Promise<void> => {
		setIsDeleting(true);
		setDeleteError("");
		try {
			// Finish outstanding writes before removing their target, even if some edits are invalid.
			await saveControl.current?.flush().catch(() => undefined);
			await deleteTwin(actions, twinId);
		} catch (cause) {
			setIsDeleting(false);
			setDeleteError(
				cause instanceof Error
					? cause.message
					: "Your Digital Twin could not be deleted.",
			);
			return;
		}
		toast.success("Digital Twin deleted");
		void navigate("/twins", { replace: true });
	};

	const back = (
		<Button
			asChild
			variant="ghost"
			size="sm"
			className="-ms-2 mb-2 pointer-coarse:min-h-11"
		>
			<Link to="/twins">
				<ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
				Digital Twins
			</Link>
		</Button>
	);
	if (agent === undefined || !catalog.skills) {
		const error = twin.error || catalog.error;
		return (
			<CollaborationPage>
				{back}
				{error ? (
					<Alert variant="destructive">
						<AlertTitle>
							Could not load your Digital Twin
						</AlertTitle>
						<AlertDescription>
							{error}
							<Button
								type="button"
								variant="outline"
								onClick={
									twin.error ? twin.reload : catalog.refresh
								}
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				) : (
					<div className="flex max-w-3xl flex-col gap-4">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-96 w-full" />
						<output className="sr-only">
							Loading your Digital Twin…
						</output>
					</div>
				)}
			</CollaborationPage>
		);
	}

	if (agent === null) {
		return (
			<CollaborationPage>
				{back}
				<TwinCreateWizard
					ownerName={
						givenFirst(
							state.liveProfile?.name?.trim() ||
								state.profile.name.trim(),
						) || "the person who made you"
					}
					skills={catalog.skills}
					hasPersona={hasPersona}
					// the new twin stays on its own scene until the owner moves on from it
					onOpenSettings={twin.reload}
				/>
			</CollaborationPage>
		);
	}

	const twinId = agent.workspace_id;
	const name = savedName ?? agent.name;
	const imageUrl = `${agentImageUrl(twinId)}${imageRevision ? `&v=${imageRevision}` : ""}`;
	return (
		<CollaborationPage>
			<div className="@container/twins mx-auto flex w-full max-w-5xl flex-col gap-5">
				<div className="flex flex-wrap items-baseline gap-2 text-sm">
					{back}
					<span aria-hidden="true" className="text-border">
						/
					</span>
					<span className="text-muted-foreground">Manage</span>
				</div>
				<TwinPageCover twinId={twinId} name={name} portrait={imageUrl}>
					<div className="col-span-full flex flex-wrap items-center gap-2">
						<Button
							asChild
							size="sm"
							className="pointer-coarse:min-h-11"
						>
							<Link to={twinChatPath(twinId)}>
								<MessageCircle aria-hidden="true" />
								Chat
							</Link>
						</Button>
						<Button
							asChild
							size="sm"
							variant="outline"
							className="pointer-coarse:min-h-11 bg-card text-card-foreground"
						>
							<Link to={twinContentsPath(undefined, twinId)}>
								<BookOpenText aria-hidden="true" />
								What it knows
							</Link>
						</Button>
					</div>
				</TwinPageCover>
				<Tabs
					// the address holds the tab, so a link can open on the people whenever it arrives
					value={
						params.get("tab") === "people" ? "people" : "profile"
					}
					onValueChange={(tab) => {
						const next = new URLSearchParams(params);
						if (tab === "people") next.set("tab", tab);
						else next.delete("tab");
						setParams(next, { replace: true });
					}}
					className="gap-6"
				>
					<TabsList
						aria-label="Twin settings"
						className="min-h-10 pointer-coarse:min-h-12 w-full sm:w-fit"
					>
						<TabsTrigger
							value="profile"
							className="pointer-coarse:min-h-11 px-4"
						>
							<SlidersHorizontal aria-hidden="true" />
							Profile
						</TabsTrigger>
						<TabsTrigger
							value="people"
							className="pointer-coarse:min-h-11 px-4"
						>
							<Users aria-hidden="true" />
							People
						</TabsTrigger>
					</TabsList>
					{/* mounted while hidden, so half-made changes survive a look at People */}
					<TabsContent
						value="profile"
						forceMount
						className="data-[state=inactive]:hidden"
					>
						<TwinProfileForm
							twin={{
								id: twinId,
								profile: {
									name: agent.name,
									instructions: agent.system_prompt,
									greeting: agent.config_json?.greeting ?? "",
									about: about ?? "",
									skills: agent.skills.map(
										(skill) => skill.id,
									),
									// knowledge bases are not the form's; saving keeps them
									toolboxes: agent.mcp
										.filter(
											(entry) => entry.type !== "VECTOR",
										)
										.map(({ id, name, type }) => ({
											id,
											name,
											type,
										})),
									usePersona:
										persona?.offTwins.includes(twinId) !==
										true,
								},
							}}
							skills={catalog.skills}
							imageUrl={imageUrl}
							isNoteUnread={about === null}
							persona={persona}
							hasPersona={hasPersona}
							onSaved={handleSaved}
							saveControl={saveControl}
						/>
					</TabsContent>
					<TabsContent value="people" className="flex flex-col gap-4">
						<TwinPeople twin={{ id: twinId, name }} />
					</TabsContent>
				</Tabs>
				{blocker.state === "blocked" && leaveError && (
					<Dialog
						open
						onOpenChange={(open) => {
							if (!open) {
								setLeaveError("");
								blocker.reset();
							}
						}}
					>
						<DialogContent
							onOpenAutoFocus={(event) => {
								const active = document.activeElement;
								previousFocus.current =
									active instanceof HTMLElement
										? active
										: null;
								event.preventDefault();
								keepEditing.current?.focus();
							}}
							onCloseAutoFocus={(event) => {
								if (previousFocus.current?.isConnected) {
									event.preventDefault();
									previousFocus.current.focus();
								}
							}}
						>
							<DialogHeader>
								<DialogTitle>
									Leave with unsaved changes?
								</DialogTitle>
								<DialogDescription>
									{leaveError}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setLeaveError("");
										blocker.proceed();
									}}
								>
									Leave without saving
								</Button>
								<Button
									type="button"
									ref={keepEditing}
									onClick={() => {
										setLeaveError("");
										blocker.reset();
									}}
								>
									Keep editing
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
				<div className="flex justify-end border-t pt-2">
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
								variant="ghost"
								size="sm"
								className="pointer-coarse:min-h-11 text-muted-foreground hover:text-destructive"
							>
								<Trash2 aria-hidden="true" />
								Delete Digital Twin
							</Button>
						</DialogTrigger>
						<DialogContent
							aria-busy={isDeleting}
							showCloseButton={!isDeleting}
							onEscapeKeyDown={(event) => {
								if (isDeleting) event.preventDefault();
							}}
							onInteractOutside={(event) => {
								if (isDeleting) event.preventDefault();
							}}
						>
							<DialogHeader>
								<DialogTitle className="wrap-anywhere">
									Delete {name}?
								</DialogTitle>
								<DialogDescription>
									The copies of emails, Teams chats and files
									it holds are deleted with it, and the people
									you shared it with can no longer chat with
									it. This cannot be undone.
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
									onClick={() => setIsDeleteOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="destructive"
									disabled={isDeleting}
									onClick={() => void handleDelete(twinId)}
								>
									{isDeleting ? "Deleting…" : "Delete"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</CollaborationPage>
	);
}
