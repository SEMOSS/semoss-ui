import { useId, useState } from "react";
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
}

/**
 * Dialog for creating the next migration version -- writes the
 * `V<version>__<description>.sql` file under the engine's own
 * `assets/migrations` folder server-side (never hand-created on disk) and
 * immediately runs it via {@code SaveEngineMigration}.
 */
export function NewMigrationDialog({ open, onClose }: NewMigrationDialogProps) {
	const { active } = useEngine();
	const { configStore } = useRootStore();

	const descriptionId = useId();
	const sqlId = useId();
	const [description, setDescription] = useState("");
	const [sqlContent, setSqlContent] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const reset = () => {
		setDescription("");
		setSqlContent("");
	};

	const handleSave = async () => {
		if (!description.trim() || !sqlContent.trim()) {
			toast.error("Description and SQL content are both required");
			return;
		}

		setSubmitting(true);
		try {
			const { errors, pixelReturn } = await configStore.runPixel<
				[SaveMigrationResult]
			>(
				`SaveEngineMigration(engine=["${active.id}"], sql=[${JSON.stringify(sqlContent)}], description=[${JSON.stringify(description)}]);`,
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
			toast.error(
				e instanceof Error ? e.message : "Failed to save migration",
			);
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
				<DialogHeader>
					<DialogTitle>New Migration</DialogTitle>
					<DialogDescription>
						Creates the next versioned SQL file under this engine's
						own migrations folder and runs it immediately.
					</DialogDescription>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={descriptionId}>
							Description
						</FieldLabel>
						<Input
							id={descriptionId}
							placeholder="add_status_column"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor={sqlId}>SQL</FieldLabel>
						<Textarea
							id={sqlId}
							className="min-h-48 font-mono text-sm"
							placeholder="ALTER TABLE ORDERS ADD COLUMN STATUS VARCHAR(50);"
							value={sqlContent}
							onChange={(e) => setSqlContent(e.target.value)}
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
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={submitting}
						data-testid="engineMigrations-save-btn"
					>
						{submitting ? <Spinner className="size-3.5" /> : null}
						Save & Run
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
