import {
	FileJsonIcon,
	FolderIcon,
	PlayIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import {
	Button,
	H4,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type {
	AppTestRecording,
	AppTestRecordingSummary,
} from "./app-test.types";
import { AppTestFileDialog } from "./app-test-file-dialog";

interface AppTestFilesProps {
	/** Metadata-only entries for the app being edited. */
	recordings: AppTestRecordingSummary[];
	appId: string;
	isLoading: boolean;
	/** Mutations are disabled while a replay, save or recording is in progress. */
	isBusy: boolean;
	selectedId: string;
	onSelect: (id: string) => void;
	onRefresh: () => void;
	onRun: (id: string) => void;
	onRunAll: () => void;
	onSave: (recording: AppTestRecording) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}

/** A compact file listing with standard view, edit, and delete actions. */
export const AppTestFiles = ({
	appId,
	recordings,
	isLoading,
	isBusy,
	selectedId,
	onSelect,
	onRefresh,
	onRun,
	onRunAll,
	onSave,
	onDelete,
}: AppTestFilesProps) => {
	const opener = useRef<HTMLButtonElement | null>(null);
	const refreshButton = useRef<HTMLButtonElement | null>(null);
	const [opened, setOpened] = useState<{
		recording: AppTestRecordingSummary;
		mode: "view" | "edit" | "delete";
	} | null>(null);
	const hasOpenedFile =
		isLoading ||
		(opened &&
			recordings.some(
				(recording) => recording.id === opened.recording.id,
			));
	return (
		<section
			aria-label="Test files"
			className="mt-4 flex min-w-0 flex-col border-t"
		>
			<div className="flex flex-wrap items-center justify-between gap-2 py-2">
				<H4>Test files</H4>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						ref={refreshButton}
						type="button"
						variant="ghost"
						size="sm"
						onClick={onRefresh}
						disabled={isLoading || isBusy}
					>
						<RefreshCwIcon aria-hidden="true" className="size-4" />
						Refresh tests
					</Button>
					<Button
						type="button"
						size="sm"
						disabled={
							isLoading || isBusy || recordings.length === 0
						}
						onClick={onRunAll}
					>
						<PlayIcon aria-hidden="true" className="size-4" />
						Run all
					</Button>
				</div>
			</div>
			<p className="mb-2 flex min-w-0 items-center gap-2 break-all font-mono text-muted-foreground text-xs">
				<FolderIcon aria-hidden="true" className="size-4 shrink-0" />
				assets / app-tests / tests
			</p>
			{isLoading ? (
				<output className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					Loading test files…
				</output>
			) : recordings.length === 0 ? (
				<p className="py-4 text-muted-foreground text-sm">
					No saved test files. Record a workflow and add a check to
					create one, or upload a test JSON file.
				</p>
			) : (
				<section
					aria-label="Test file listing"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the bounded table.
					tabIndex={0}
					className="min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
				>
					<Table wrapperClassName="overflow-visible">
						<TableHeader>
							<TableRow>
								<TableHead scope="col">File</TableHead>
								<TableHead scope="col">Description</TableHead>
								<TableHead scope="col">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recordings.map((recording) => (
								<TableRow
									key={recording.id}
									data-state={
										selectedId === recording.id
											? "selected"
											: undefined
									}
								>
									<TableCell>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-auto min-h-8 max-w-64 whitespace-normal break-words text-start"
											aria-label={`Open ${recording.name}`}
											onClick={(event) => {
												opener.current =
													event.currentTarget;
												setOpened({
													recording,
													mode: "view",
												});
												onSelect(recording.id);
											}}
										>
											<FileJsonIcon
												aria-hidden="true"
												className="size-4"
											/>
											{recording.name}
										</Button>
										<div className="font-mono text-muted-foreground text-xs">
											{recording.id}.json
										</div>
									</TableCell>
									<TableCell className="min-w-40 max-w-64 whitespace-normal break-words">
										<p className="line-clamp-2">
											{recording.description}
										</p>
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={isBusy || isLoading}
												aria-label={`Run test ${recording.name}`}
												onClick={() =>
													onRun(recording.id)
												}
											>
												<PlayIcon
													aria-hidden="true"
													className="size-4"
												/>
												Run test
											</Button>
											{(["edit", "delete"] as const).map(
												(mode) => (
													<Button
														key={mode}
														type="button"
														size="sm"
														variant="ghost"
														disabled={isBusy}
														aria-label={`${mode === "edit" ? "Edit" : "Delete"} ${recording.name}`}
														onClick={(event) => {
															opener.current =
																event.currentTarget;
															setOpened({
																recording,
																mode,
															});
														}}
													>
														{mode === "edit"
															? "Edit"
															: "Delete"}
													</Button>
												),
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</section>
			)}
			{opened && hasOpenedFile && (
				<AppTestFileDialog
					appId={appId}
					key={`${opened.recording.id}-${opened.mode}`}
					recording={opened.recording}
					mode={opened.mode}
					onSave={onSave}
					onDelete={onDelete}
					onClose={() => setOpened(null)}
					onReturnFocus={() => {
						if (opener.current?.isConnected) opener.current.focus();
						else refreshButton.current?.focus();
					}}
				/>
			)}
		</section>
	);
};
