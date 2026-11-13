import { ArrowLeft, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useConfig, useInsight } from "@semoss/sdk/react";
import { MembersTable } from "@semoss/shared";
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
	H2,
	P,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentImageUrl } from "@/features/agents/api/agent-image";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useSkillCatalog } from "@/features/routines/use-skill-catalog";
import { givenFirst } from "@/lib/person-name";
import { twinChatPath, twinContentsPath } from "@/lib/workspace-paths";
import { deleteTwin, getMyTwinAgent } from "./api/digital-twin";
import { TwinCreateWizard } from "./twin-create-wizard";
import { TwinProfileForm } from "./twin-profile-form";
import { useTwinPeopleSource } from "./use-twin-people-source";
import { useTwinRead } from "./use-twin-read";

/**
 * The owner's own Digital Twin: the steps that create it while they have none,
 * and then its profile, the people it is shared with, and its delete. A link
 * with `?tab=people` opens on the people.
 */
export function TwinSettings() {
	const { actions } = useInsight();
	const { state } = useCollaborationSession();
	const navigate = useNavigate();
	const [params, setParams] = useSearchParams();
	const deleteId = useId();
	const twin = useTwinRead(getMyTwinAgent);
	const catalog = useSkillCatalog();
	const isDirectoryAvailable = useConfig(
		(config) => config.config?.msGraphLookup === true,
	);
	const agent = twin.data;
	const people = useTwinPeopleSource(agent?.workspace_id ?? "");
	// the browser keeps the image it has for an address, so a new upload gets a new one
	const [imageRevision, setImageRevision] = useState(0);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	const handleSaved = (): void => {
		setImageRevision((revision) => revision + 1);
		// the name above the form comes from the server
		twin.reload();
	};
	const handleDelete = async (twinId: string): Promise<void> => {
		setIsDeleting(true);
		setDeleteError("");
		try {
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
			className="-ml-2 mb-2 pointer-coarse:min-h-11"
		>
			<Link to="/twins">
				<ArrowLeft aria-hidden="true" />
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
					// the new twin stays on its own scene until the owner moves on from it
					onOpenSettings={twin.reload}
				/>
			</CollaborationPage>
		);
	}

	const twinId = agent.workspace_id;
	const imageUrl = `${agentImageUrl(twinId)}${imageRevision ? `&v=${imageRevision}` : ""}`;
	return (
		<CollaborationPage>
			{back}
			<CollaborationPageHeader
				title={
					<span className="flex min-w-0 items-center gap-4">
						<AgentAvatar
							agent={{ name: agent.name, avatar: imageUrl }}
							size="lg"
						/>
						<span className="wrap-anywhere min-w-0">
							{agent.name}
						</span>
					</span>
				}
				description="Your Digital Twin. It answers from the copies you put into it, for the people you name."
				// beside a long name on a phone the links would leave it a column one letter wide
				layoutClassName="flex-col sm:flex-row"
				actions={
					<>
						<Button
							asChild
							variant="outline"
							className="pointer-coarse:min-h-11"
						>
							<Link to={twinContentsPath()}>What it knows</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="pointer-coarse:min-h-11"
						>
							<Link to={twinChatPath(twinId)}>Chat</Link>
						</Button>
					</>
				}
			/>
			<Tabs
				// the address holds the tab, so a link can open on the people whenever it arrives
				value={params.get("tab") === "people" ? "people" : "profile"}
				onValueChange={(tab) =>
					setParams(tab === "people" ? { tab } : {}, {
						replace: true,
					})
				}
				className="gap-6"
			>
				<TabsList className="w-full sm:w-fit">
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="people">People</TabsTrigger>
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
								skills: agent.skills.map((skill) => skill.id),
								// knowledge bases are not the form's; saving keeps them
								toolboxes: agent.mcp
									.filter((entry) => entry.type !== "VECTOR")
									.map(({ id, name, type }) => ({
										id,
										name,
										type,
									})),
							},
						}}
						skills={catalog.skills}
						imageUrl={imageUrl}
						onSaved={handleSaved}
					/>
				</TabsContent>
				<TabsContent value="people" className="flex flex-col gap-4">
					<P className="max-w-prose text-muted-foreground text-sm">
						The people who can chat with your Digital Twin. Each can
						also open the copies it holds, read its instructions and
						see who else is on this list.
					</P>
					<MembersTable
						source={people}
						isDirectoryAvailable={isDirectoryAvailable}
					/>
				</TabsContent>
			</Tabs>
			<section
				aria-labelledby={deleteId}
				className="mt-10 flex flex-col items-start gap-3 border-t pt-6"
			>
				<H2 id={deleteId} className="font-medium text-base">
					Delete your Digital Twin
				</H2>
				<P className="max-w-prose text-muted-foreground text-sm">
					This deletes your Digital Twin with the copies it holds, and
					ends everyone's access to it. It cannot be undone.
				</P>
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
							variant="destructive"
							className="pointer-coarse:min-h-11"
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
								Delete {agent.name}?
							</DialogTitle>
							<DialogDescription>
								The copies of emails, Teams chats and files it
								holds are deleted with it, and the people you
								shared it with can no longer chat with it. This
								cannot be undone.
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
			</section>
		</CollaborationPage>
	);
}
