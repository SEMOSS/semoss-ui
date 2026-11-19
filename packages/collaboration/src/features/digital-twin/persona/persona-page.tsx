import { ArrowLeft, Trash2 } from "lucide-react";
import { useId, useState } from "react";
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
	H2,
	P,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { useTwinRead } from "../use-twin-read";
import {
	deleteTwinPersona,
	getTwinPersona,
	type PersonaSections,
	saveTwinPersona,
	type TwinPersona,
} from "./api/persona";
import { interviewLink } from "./interview-link";
import { PersonaSectionsForm } from "./persona-sections-form";

/**
 * The signed-in person's persona for their Digital Twins: what it says, as
 * text they can change, the way to the interview that writes it, and a way
 * to delete it. Someone with none yet can also write their first here.
 */
export function PersonaPage() {
	const { actions } = useInsight();
	const read = useTwinRead(getTwinPersona);
	// what a save or a delete on this page made of it, which is newer than what was read
	const [changed, setChanged] = useState<TwinPersona>();
	const persona = changed ?? read.data;
	// a deleted persona starts the boxes over
	const [deletes, setDeletes] = useState(0);
	const deleteId = useId();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const interview = persona && interviewLink(persona);

	const handleSave = async (
		sections: PersonaSections,
	): Promise<PersonaSections> => {
		const saved = await saveTwinPersona(actions, sections);
		setChanged(saved);
		toast.success("Persona saved");
		return saved.sections;
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
		setIsDeleteOpen(false);
		toast.success("Persona deleted");
	};

	return (
		<CollaborationPage>
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
			<CollaborationPageHeader
				title="Your persona"
				description="How you sound, how you decide and what you keep for yourself. Every Digital Twin you created answers this way, unless you switch it off on that twin's Profile."
				layoutClassName="flex-col sm:flex-row"
				actions={
					interview && (
						<Button
							asChild
							variant="outline"
							className="pointer-coarse:min-h-11"
						>
							<Link to={interview.to}>{interview.label}</Link>
						</Button>
					)
				}
			>
				<P className="max-w-prose text-muted-foreground text-sm">
					The people you share a twin with cannot open this page, but
					a twin can be talked into quoting what it was told. Write
					nothing here that you would not say to them.
				</P>
			</CollaborationPageHeader>
			{persona ? (
				<>
					{!persona.exists && (
						<P className="mb-6 max-w-prose text-sm">
							The interview writes these for you from a few
							questions, in under ten minutes. You can also write
							them yourself, here.
						</P>
					)}
					<PersonaSectionsForm
						key={deletes}
						sections={persona.sections}
						onSave={handleSave}
					/>
					{persona.exists && (
						<section
							aria-labelledby={deleteId}
							className="mt-10 flex flex-col items-start gap-3 border-t pt-6"
						>
							<H2 id={deleteId} className="font-medium text-base">
								Delete your persona
							</H2>
							<P className="max-w-prose text-muted-foreground text-sm">
								Your Digital Twins go back to answering plainly,
								from their next chat. It cannot be undone.
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
										Delete persona
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
										<DialogTitle>
											Delete your persona?
										</DialogTitle>
										<DialogDescription>
											Everything written here is deleted,
											and your Digital Twins stop
											answering in your voice. It cannot
											be undone.
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
											onClick={() => void handleDelete()}
										>
											{isDeleting
												? "Deleting…"
												: "Delete"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</section>
					)}
				</>
			) : read.error ? (
				<Alert variant="destructive">
					<AlertTitle>Could not load your persona</AlertTitle>
					<AlertDescription>
						{read.error}
						<Button
							type="button"
							variant="outline"
							onClick={read.reload}
						>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			) : (
				<div className="flex max-w-3xl flex-col gap-4">
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-96 w-full" />
					<output className="sr-only">Loading your persona…</output>
				</div>
			)}
		</CollaborationPage>
	);
}
