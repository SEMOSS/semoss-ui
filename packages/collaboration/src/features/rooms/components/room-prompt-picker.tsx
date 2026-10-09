import { type RefObject, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	P,
} from "@semoss/ui/next";
import type { ComposerPrompt } from "./room-composer.types";
/** Search available room prompts and insert one into the editable draft. */
export function RoomPromptPicker({
	open,
	onOpenChange,
	prompts,
	returnFocusRef,
	onSelect,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	prompts: readonly ComposerPrompt[];
	/** Restore menu-trigger focus when the picker closes. */
	returnFocusRef?: RefObject<HTMLButtonElement | null>;
	onSelect: (text: string) => void;
}) {
	const [search, setSearch] = useState("");
	const query = search.trim().toLowerCase();
	const matches = prompts.filter((prompt) =>
		`${prompt.title} ${prompt.context}`.toLowerCase().includes(query),
	);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-full overflow-y-auto sm:max-w-xl"
				onCloseAutoFocus={(event) => {
					if (!returnFocusRef?.current) return;
					event.preventDefault();
					returnFocusRef.current.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>Prompt library</DialogTitle>
					<DialogDescription>
						Choose a starting point, then edit it before sending.
					</DialogDescription>
				</DialogHeader>
				<Input
					aria-label="Search prompts"
					placeholder="Search prompts"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
				<div className="max-h-80 space-y-2 overflow-y-auto">
					{matches.length === 0 && (
						<P className="text-muted-foreground">
							No matching prompts.
						</P>
					)}
					{matches.map((prompt) => (
						<Button
							key={prompt.id}
							type="button"
							variant="outline"
							className="h-auto w-full flex-col items-start whitespace-normal p-4 text-start"
							onClick={() => {
								onSelect(prompt.context);
								onOpenChange(false);
							}}
						>
							<span className="font-medium">{prompt.title}</span>
							<span className="line-clamp-3 font-normal text-muted-foreground">
								{prompt.context}
							</span>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
