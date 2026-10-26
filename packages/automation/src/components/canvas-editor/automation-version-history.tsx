import { History, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	InlineCode,
	Muted,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	type AutomationVersion,
	listAutomationVersions,
	rollbackAutomation,
} from "../../api/automation-history";
import { normalizeAutomationErrorMessage } from "../../domain/automation-utils";

interface AutomationVersionHistoryProps {
	/** Automation project whose saved versions are listed. */
	appId: string;
	/** Whether the modal is open. */
	open: boolean;
	/** Updates modal visibility in the canvas. */
	onOpenChange: (open: boolean) => void;
	/** Reloads the canvas after a confirmed server-side restore. */
	onRestored: () => void;
	/** Whether restoring will discard a local draft. */
	isDirty: boolean;
	/** Whether the current user and canvas state allow restoring. */
	canRestore: boolean;
	/** Current definition revision used to reject a stale restore. */
	currentRevision: string | null;
	/** Prevents opening history while the canvas is busy. */
	disabled: boolean;
	/** Whether advanced developer controls are visible. */
	isDeveloperMode: boolean;
}

const RESTORE_MESSAGE_PREFIX = "Restore automation definition from ";

function formatRevision(revision: string): string {
	return revision.length > 12 ? revision.slice(0, 12) : revision;
}

function formatVersionMessage(message: string): string {
	if (!message.startsWith(RESTORE_MESSAGE_PREFIX)) {
		return message || "Saved automation";
	}
	const restoredRevision = message
		.slice(RESTORE_MESSAGE_PREFIX.length)
		.trim();
	return restoredRevision
		? `Restored from ${formatRevision(restoredRevision)}`
		: "Restored automation";
}

/** Lists saved versions and confirms restoration before replacing the canvas draft. */
export function AutomationVersionHistory({
	appId,
	open,
	onOpenChange,
	onRestored,
	isDirty,
	canRestore,
	currentRevision,
	disabled,
	isDeveloperMode,
}: AutomationVersionHistoryProps) {
	const [versions, setVersions] = useState<AutomationVersion[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] =
		useState<AutomationVersion | null>(null);
	const [isRestoring, setIsRestoring] = useState(false);
	const requestGeneration = useRef(0);
	const restorePending = useRef(false);
	const backButton = useRef<HTMLButtonElement>(null);
	const selectedButton = useRef<HTMLButtonElement | null>(null);
	const isOpen = isDeveloperMode && open;

	const loadVersions = useCallback(() => {
		const generation = ++requestGeneration.current;
		setIsLoading(true);
		setError(null);
		setVersions([]);
		setSelectedVersion(null);
		void listAutomationVersions(appId)
			.then((result) => {
				if (requestGeneration.current === generation)
					setVersions(result);
			})
			.catch((reason: unknown) => {
				if (requestGeneration.current === generation) {
					setError(
						reason instanceof Error
							? normalizeAutomationErrorMessage(reason.message)
							: "Unable to load version history.",
					);
				}
			})
			.finally(() => {
				if (requestGeneration.current === generation)
					setIsLoading(false);
			});
	}, [appId]);

	useEffect(() => {
		if (isOpen) loadVersions();
		return () => {
			requestGeneration.current += 1;
		};
	}, [isOpen, loadVersions]);

	useEffect(() => {
		if (!isOpen) return;
		if (selectedVersion) backButton.current?.focus();
		else selectedButton.current?.focus();
	}, [isOpen, selectedVersion]);

	const handleRestore = async (): Promise<void> => {
		if (
			!selectedVersion ||
			!canRestore ||
			!currentRevision ||
			disabled ||
			restorePending.current
		)
			return;
		const generation = requestGeneration.current;
		restorePending.current = true;
		setIsRestoring(true);
		setError(null);
		try {
			await rollbackAutomation(
				appId,
				selectedVersion.id,
				currentRevision,
			);
		} catch (reason: unknown) {
			if (requestGeneration.current === generation) {
				setError(
					reason instanceof Error
						? normalizeAutomationErrorMessage(reason.message)
						: "Unable to restore this version.",
				);
			}
			return;
		} finally {
			restorePending.current = false;
			if (requestGeneration.current === generation) setIsRestoring(false);
		}
		if (requestGeneration.current !== generation) return;
		onRestored();
		onOpenChange(false);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(nextOpen) => {
				if (isDeveloperMode && !restorePending.current)
					onOpenChange(nextOpen);
			}}
		>
			{isDeveloperMode && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="bg-background shadow-sm"
								disabled={disabled}
								aria-label="Version history"
							>
								<History
									className="size-3.5"
									aria-hidden="true"
								/>
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						Version history
					</TooltipContent>
				</Tooltip>
			)}
			<DialogContent
				className="sm:max-w-lg"
				showCloseButton={!isRestoring}
				onEscapeKeyDown={(event) => {
					if (restorePending.current) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (restorePending.current) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{selectedVersion
							? `Restore version ${formatRevision(selectedVersion.id)}?`
							: "Version history"}
					</DialogTitle>
					<DialogDescription>
						{selectedVersion
							? `This replaces the saved workflow and creates a new version.${isDirty ? " Unsaved canvas changes will be discarded." : ""}`
							: "Saved automation revisions (up to 100 most recent)."}
					</DialogDescription>
				</DialogHeader>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<div hidden={selectedVersion !== null}>
					{isLoading ? (
						<output className="py-6 text-muted-foreground text-sm">
							Loading versions...
						</output>
					) : error && versions.length === 0 ? (
						<Button
							type="button"
							variant="outline"
							onClick={loadVersions}
						>
							Retry
						</Button>
					) : versions.length === 0 ? (
						<output className="py-6 text-muted-foreground text-sm">
							No saved versions
						</output>
					) : (
						<ul
							className="max-h-80 divide-y overflow-y-auto pr-2"
							aria-label="Saved versions"
						>
							{versions.map((version) => (
								<li
									key={version.id}
									className="flex min-w-0 flex-col gap-3 px-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
								>
									<div className="min-w-0 space-y-2">
										<Small
											className="break-words text-foreground"
											title={version.message}
										>
											{formatVersionMessage(
												version.message,
											)}
										</Small>
										<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
											<Muted>{version.user}</Muted>
											<span
												className="text-muted-foreground"
												aria-hidden="true"
											>
												•
											</span>
											<Muted>{version.date}</Muted>
										</div>
										<InlineCode
											title={`Revision ${version.id}`}
										>
											{formatRevision(version.id)}
										</InlineCode>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="shrink-0"
										disabled={
											!canRestore ||
											!currentRevision ||
											disabled
										}
										aria-label={`Restore version ${version.id}`}
										onClick={(event) => {
											selectedButton.current =
												event.currentTarget;
											setError(null);
											setSelectedVersion(version);
										}}
									>
										<RotateCcw
											className="size-3.5"
											aria-hidden="true"
										/>{" "}
										Restore
									</Button>
								</li>
							))}
						</ul>
					)}
				</div>
				{selectedVersion && (
					<>
						<div className="space-y-2 break-words">
							<Small className="text-foreground">
								{formatVersionMessage(selectedVersion.message)}
							</Small>
							<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
								<Muted>{selectedVersion.user}</Muted>
								<span
									className="text-muted-foreground"
									aria-hidden="true"
								>
									•
								</span>
								<Muted>{selectedVersion.date}</Muted>
							</div>
							<InlineCode
								title={`Revision ${selectedVersion.id}`}
							>
								{formatRevision(selectedVersion.id)}
							</InlineCode>
						</div>
						<DialogFooter>
							<Button
								ref={backButton}
								type="button"
								variant="outline"
								disabled={isRestoring}
								onClick={() => {
									setSelectedVersion(null);
									setError(null);
								}}
							>
								Back
							</Button>
							<Button
								type="button"
								disabled={
									isRestoring ||
									!canRestore ||
									!currentRevision ||
									disabled
								}
								onClick={() => void handleRestore()}
							>
								{isRestoring ? (
									<Loader2
										className="size-4 animate-spin"
										aria-hidden="true"
									/>
								) : (
									<RotateCcw
										className="size-4"
										aria-hidden="true"
									/>
								)}
								{isRestoring
									? "Restoring..."
									: "Confirm restore"}
							</Button>
						</DialogFooter>
						{isRestoring && (
							<output className="sr-only">
								Restoring automation version
							</output>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
