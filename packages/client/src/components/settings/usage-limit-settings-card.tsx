import { useRef, useState } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	findModelUsageLimitProblem,
	isSameModelUsageLimit,
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	type ModelUsageLimitSource,
	UsageLimitGuideButton,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { UseStoredUsageLimitResult } from "./use-stored-usage-limit";

export interface UsageLimitSettingsCardProps {
	/** The card's title, such as "General Platform Limit" */
	title: string;
	/** Who the limit applies to, under the title */
	description: string;
	/** Where the limit is set, which decides whose use its rules can count */
	source: ModelUsageLimitSource;
	/** The limit, read and saved through `useStoredUsageLimit` */
	limit: UseStoredUsageLimitResult;
	/** What the toast says after a save */
	savedMessage: string;
}

/**
 * A settings card that edits one usage limit that belongs to no grant, such as
 * the platform default or a team's total: the editor, with Reset and Save,
 * the loading and error states of its read, and How Usage Limits Work. Save stays enabled except
 * while saving, and a limit that cannot be saved shows its problems when it is
 * pressed; Reset is enabled once something changed. After a save, the editor
 * starts again from the limit the backend saved.
 */
export const UsageLimitSettingsCard = ({
	title,
	description,
	source,
	limit,
	savedMessage,
}: UsageLimitSettingsCardProps) => {
	const { value, isLoading, error, refresh, save } = limit;
	const [draft, setDraft] = useState<ModelUsageLimit | null>(null);
	const [hasDraft, setHasDraft] = useState(false);
	// a new key starts the editor again from the saved limit
	const [editorKey, setEditorKey] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	// the limit's problems show from the first save they stop, until it is
	// saved or reset
	const [shouldShowProblems, setShouldShowProblems] = useState(false);
	const editorRef = useRef<ModelUsageLimitEditorHandle>(null);
	const current = hasDraft ? draft : value;
	const isDirty = hasDraft && !isSameModelUsageLimit(draft, value);
	const problem = findModelUsageLimitProblem(current, {
		source,
		isCostAvailable: true,
	});

	const handleReset = () => {
		setHasDraft(false);
		setDraft(null);
		setSaveError(null);
		setShouldShowProblems(false);
		setEditorKey((key) => key + 1);
	};

	const handleSave = async () => {
		if (problem) {
			setShouldShowProblems(true);
			editorRef.current?.focusFirstProblem();
			return;
		}
		setIsSaving(true);
		setSaveError(null);
		try {
			await save(current);
			setHasDraft(false);
			setDraft(null);
			setShouldShowProblems(false);
			// the editor starts again from the limit the backend saved
			setEditorKey((key) => key + 1);
			toast.success(savedMessage);
		} catch (e) {
			setSaveError(getErrorMessage(e, "The limit was not saved"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
				<CardAction>
					<UsageLimitGuideButton viewer={{ isAdminMode: true }} />
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription className="flex flex-col items-start gap-2">
							{error}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={refresh}
							>
								Try Again
							</Button>
						</AlertDescription>
					</Alert>
				) : isLoading ? (
					<output className="flex items-center gap-2 text-muted-foreground text-sm">
						<Spinner className="size-4" aria-hidden />
						Loading the limit...
					</output>
				) : (
					<ModelUsageLimitEditor
						key={editorKey}
						ref={editorRef}
						defaultValue={value}
						onChange={(next) => {
							setDraft(next);
							setHasDraft(true);
						}}
						source={source}
						shouldShowProblems={shouldShowProblems}
						disabled={isSaving}
					/>
				)}
				{saveError ? (
					<Alert variant="destructive">
						<AlertDescription>{saveError}</AlertDescription>
					</Alert>
				) : null}
			</CardContent>
			{!error && !isLoading ? (
				<CardFooter className="flex flex-wrap items-center justify-end gap-2">
					{shouldShowProblems && problem ? (
						<span className="me-auto text-destructive text-xs">
							{problem}
						</span>
					) : null}
					<Button
						type="button"
						variant="outline"
						disabled={!isDirty || isSaving}
						onClick={handleReset}
					>
						Reset
					</Button>
					{/* Save stays enabled, so a limit that cannot be saved shows why */}
					<Button
						type="button"
						disabled={isSaving}
						onClick={handleSave}
					>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</CardFooter>
			) : null}
		</Card>
	);
};
