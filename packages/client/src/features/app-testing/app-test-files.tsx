import { useRef, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	H4,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type { AppTestRecording } from "./app-test.types";

interface AppTestFilesProps {
	/** Validated saved JSON files for the app being edited. */
	recordings: AppTestRecording[];
	isLoading: boolean;
	/** Selecting an opened file also makes it the next replay target. */
	onSelect: (id: string) => void;
}

/** Browse saved tests and read their complete definitions without changing their expectations. */
export const AppTestFiles = ({
	recordings,
	isLoading,
	onSelect,
}: AppTestFilesProps) => {
	const opener = useRef<HTMLButtonElement | null>(null);
	const [openedId, setOpenedId] = useState<string | null>(null);
	const opened = recordings.find((recording) => recording.id === openedId);
	return (
		<div className="mt-4 flex min-w-0 flex-col gap-3 border-t pt-3">
			<H4>Test files</H4>
			{isLoading ? (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					Loading test files…
				</div>
			) : recordings.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No saved test files. Record a workflow and add a check to
					create one.
				</p>
			) : (
				<ul className="flex min-w-0 flex-col divide-y">
					{recordings.map((recording) => (
						<li
							key={recording.id}
							className="flex min-w-0 flex-col gap-1 py-3"
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="min-w-0 break-words font-medium text-sm">
									{recording.name}
								</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-label={`Open ${recording.name}`}
									onClick={(event) => {
										opener.current = event.currentTarget;
										setOpenedId(recording.id);
										onSelect(recording.id);
									}}
								>
									Open file
								</Button>
							</div>
							<p className="whitespace-pre-wrap break-words text-muted-foreground text-sm">
								{recording.description}
							</p>
							<span className="break-all font-mono text-muted-foreground text-xs">
								{recording.id}.json
							</span>
							<span className="text-muted-foreground text-xs">
								{recording.steps.length} steps ·{" "}
								{
									recording.steps.filter((step) =>
										step.type.startsWith("ASSERT_"),
									).length
								}{" "}
								checks
							</span>
						</li>
					))}
				</ul>
			)}
			<Dialog
				open={Boolean(opened)}
				onOpenChange={(isOpen) => {
					if (!isOpen) setOpenedId(null);
				}}
			>
				<DialogContent
					className="min-w-0 sm:max-w-3xl"
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						if (opener.current?.isConnected) opener.current.focus();
					}}
				>
					<DialogHeader>
						<DialogTitle>{opened?.name}</DialogTitle>
						<DialogDescription className="whitespace-pre-wrap break-words">
							{opened?.description}
						</DialogDescription>
					</DialogHeader>
					{opened && (
						<>
							<p className="break-all font-mono text-muted-foreground text-xs">
								app-tests/recordings/{opened.id}.json
							</p>
							<p className="text-muted-foreground text-sm">
								Read-only test definition · Start page:{" "}
								{opened.startPath || "App home"}
							</p>
							<Textarea
								readOnly
								aria-label="Test file JSON"
								value={JSON.stringify(opened, null, 2)}
								rows={14}
								className="min-w-0 font-mono text-xs"
							/>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};
