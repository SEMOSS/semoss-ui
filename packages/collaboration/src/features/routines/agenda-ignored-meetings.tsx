import { useRef } from "react";
import { Button, Small } from "@semoss/ui/next";

interface AgendaIgnoredMeetingsProps {
	/** Ignored titles to list, after any filter. */
	titles: string[];
	/** Tells rows apart when titles can repeat; the title when not given. */
	keys?: string[];
	/** Every ignored title, to tell an empty list from a filtered one. */
	total: number;
	/** Receives a title to show in the lists again. */
	onRestore: (title: string, index: number) => void;
	/** Locks the buttons while a save is pending. */
	disabled: boolean;
}

/** The meetings the owner hid from the picker, each with a way back. */
export function AgendaIgnoredMeetings({
	titles,
	keys,
	total,
	onRestore,
	disabled,
}: AgendaIgnoredMeetingsProps) {
	const boxRef = useRef<HTMLDivElement>(null);
	// the box stays mounted when empty, so focus has somewhere to land after the last row goes
	return (
		<div
			ref={boxRef}
			tabIndex={-1}
			className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-md border p-3 outline-none"
		>
			<Small className="text-muted-foreground">
				{total === 0
					? "Meetings you ignore are listed here, so you can restore them."
					: titles.length === 0
						? "No ignored meetings match the filter."
						: "Hidden from the other tabs. Restore one to choose it again."}
			</Small>
			<ul aria-label="Ignored meetings" className="flex flex-col gap-2">
				{titles.map((title, index) => (
					<li
						key={keys?.[index] ?? title}
						className="flex items-center justify-between gap-3"
					>
						<span className="min-w-0 break-words text-sm">
							{title}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="shrink-0"
							disabled={disabled}
							aria-label={`Restore ${title}`}
							onClick={() => {
								onRestore(title, index);
								// the row is gone, so focus stays on the list
								boxRef.current?.focus();
							}}
						>
							Restore
						</Button>
					</li>
				))}
			</ul>
		</div>
	);
}
