import { AlertTriangle, Upload, XCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useEngine, useRootStore } from "@/hooks";

interface SaveMigrationResult {
	version: string;
	success: boolean;
	errorMessage: string | null;
}

interface NewMigrationDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Called when the dialog closes; `didSave` is true if a migration was created and run. */
	onClose: (didSave: boolean) => void;
	/** The version number that will be assigned to this migration (computed from the current list). */
	nextVersion: string;
}

// only these chars are allowed in the filename segment -- enforced on input, not sanitized after
const VALID_NAME_CHARS = /[^a-zA-Z0-9\-_]/g;
// never valid in a migration — fails on every supported engine type
const BLOCKED_SQL = /\b(DROP\s+DATABASE)\b/i;
// destructive but valid migration operations — warn before running
const WARN_SQL = /\b(DROP\s+TABLE|DROP\s+SCHEMA|TRUNCATE\b)/i;

/**
 * Two-step dialog for creating the next migration version.
 * Step 1 (compose): description + SQL entry with live filename preview and optional file upload.
 * Step 2 (confirm): shows the exact filename and SQL before executing.
 *
 * Writes the `V<version>__<description>.sql` file server-side and immediately
 * runs it via `SaveEngineMigration`.
 */
export function NewMigrationDialog({
	open,
	onClose,
	nextVersion,
}: NewMigrationDialogProps) {
	const { active } = useEngine();
	const { configStore } = useRootStore();

	const descriptionId = useId();
	const sqlId = useId();
	const notesId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [step, setStep] = useState<"compose" | "confirm">("compose");
	const [description, setDescription] = useState("");
	const [notes, setNotes] = useState("");
	const [sqlContent, setSqlContent] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [runError, setRunError] = useState<string | null>(null);

	const previewFilename =
		description.trim() !== ""
			? `V${nextVersion}__${description}.sql`
			: null;
	const isBlocked = BLOCKED_SQL.test(sqlContent);
	const isDangerous = !isBlocked && WARN_SQL.test(sqlContent);
	const canAdvance =
		description.trim() !== "" && sqlContent.trim() !== "" && !isBlocked;

	const reset = () => {
		setDescription("");
		setNotes("");
		setSqlContent("");
		setStep("compose");
		setRunError(null);
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result;
			if (typeof content === "string") {
				setSqlContent(content.trim());
			}
		};
		reader.readAsText(file, "utf-8");
		// reset so the same file can be re-uploaded if needed
		e.target.value = "";
	};

	const handleSave = async () => {
		setSubmitting(true);
		try {
			const { errors, pixelReturn } = await configStore.runPixel<
				[SaveMigrationResult]
			>(
				`SaveEngineMigration(engine=["${active.id}"], sql=[${JSON.stringify(sqlContent)}], description=[${JSON.stringify(description)}]${notes.trim() ? `, notes=[${JSON.stringify(notes.trim())}]` : ""});`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			const result = pixelReturn[0]?.output;
			if (result && !result.success) {
				throw new Error(
					result.errorMessage ?? "Migration failed to run",
				);
			}

			toast.success(`Migration V${result?.version} applied successfully`);
			reset();
			onClose(true);
		} catch (e) {
			setRunError(
				e instanceof Error ? e.message : "Failed to save migration",
			);
			setStep("compose");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					reset();
					onClose(false);
				}
			}}
		>
			<DialogContent className="sm:max-w-xl">
				{step === "compose" ? (
					<>
						<DialogHeader>
							<DialogTitle>New Migration</DialogTitle>
							<DialogDescription>
								Creates the next versioned SQL file under this
								engine's migrations folder and runs it
								immediately.
							</DialogDescription>
						</DialogHeader>

						{runError !== null && (
							<div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3">
								<XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-destructive text-sm">
										Migration failed
									</span>
									<span className="text-destructive/80 text-sm">
										{runError}
									</span>
								</div>
							</div>
						)}

						{isBlocked && (
							<div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3">
								<XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
								<span className="text-destructive text-sm">
									<span className="font-medium">
										DROP DATABASE
									</span>{" "}
									is not allowed in a migration — it would
									destroy the entire database, not just modify
									its schema. Remove it to continue.
								</span>
							</div>
						)}

						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={descriptionId}>
									File Name
								</FieldLabel>
								<div className="flex items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
									<span className="select-none border-input border-r bg-muted px-3 py-2 font-mono text-muted-foreground text-sm">
										V{nextVersion}__
									</span>
									<Input
										id={descriptionId}
										className="flex-1 rounded-none border-0 font-mono shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
										placeholder="migration_name"
										value={description}
										onChange={(e) =>
											setDescription(
												e.target.value.replace(
													VALID_NAME_CHARS,
													"",
												),
											)
										}
									/>
									<span className="select-none border-input border-l bg-muted px-3 py-2 font-mono text-muted-foreground text-sm">
										.sql
									</span>
								</div>
							</Field>

							<Field>
								<div className="flex items-center justify-between">
									<FieldLabel htmlFor={sqlId}>SQL</FieldLabel>
									<button
										type="button"
										onClick={() =>
											fileInputRef.current?.click()
										}
										className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
									>
										<Upload className="size-3" />
										Upload .sql file
									</button>
									<input
										ref={fileInputRef}
										type="file"
										accept=".sql"
										className="sr-only"
										onChange={handleFileUpload}
									/>
								</div>
								<Textarea
									id={sqlId}
									className="min-h-48 font-mono text-sm"
									placeholder="ALTER TABLE ORDERS ADD COLUMN STATUS VARCHAR(50);"
									value={sqlContent}
									onChange={(e) =>
										setSqlContent(e.target.value)
									}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor={notesId}>
									Description{" "}
									<span className="font-normal text-muted-foreground">
										(optional)
									</span>
								</FieldLabel>
								<Textarea
									id={notesId}
									className="min-h-16 text-sm"
									placeholder="What does this migration do? Shown in the Migrations tab."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</Field>
						</FieldGroup>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									reset();
									onClose(false);
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={() => setStep("confirm")}
								disabled={!canAdvance}
							>
								Review
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Confirm Migration</DialogTitle>
							<DialogDescription>
								Review before running. This executes immediately
								on <strong>{active.name ?? active.id}</strong>{" "}
								and cannot be undone.
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
									File
								</span>
								<span className="font-mono text-sm">
									{previewFilename}
								</span>
							</div>

							{notes.trim() && (
								<div className="flex flex-col gap-1">
									<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
										Description
									</span>
									<span className="text-sm">
										{notes.trim()}
									</span>
								</div>
							)}

							{isDangerous && (
								<div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/10 p-3">
									<AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
									<span className="text-sm text-warning">
										This SQL contains a destructive
										statement (DROP TABLE, DROP SCHEMA, or
										TRUNCATE) that cannot be undone. Make
										sure this is intentional.
									</span>
								</div>
							)}

							<div className="flex flex-col gap-1">
								<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
									SQL
								</span>
								<pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted p-3 font-mono text-xs">
									{sqlContent}
								</pre>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									setRunError(null);
									setStep("compose");
								}}
								disabled={submitting}
							>
								Back
							</Button>
							<Button
								onClick={handleSave}
								disabled={submitting}
								data-testid="engineMigrations-save-btn"
							>
								{submitting ? (
									<Spinner className="size-3.5" />
								) : null}
								Save & Run
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
