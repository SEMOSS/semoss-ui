import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	toast,
} from "@semoss/ui/next";
import {
	countAffectedSources,
	findVariableReferences,
	noLigatureStyle,
	rewriteVariableReferences,
} from "./variable-references";

interface RenameVariableDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The current variable alias being renamed. */
	currentName: string;
	/** Optional callback fired after a successful rename. */
	onRenamed?: (newName: string) => void;
}

// SEMOSS only forbids `.` (used for dotted refs like {{name.path}}) and
// duplicates in the variable store. Cell-derived defaults often contain
// hyphens, so we allow letters / digits / underscore / hyphen.
const isValidVariableName = (value: string) => /^[a-zA-Z0-9_-]+$/.test(value);

/**
 * Shared dialog for renaming a notebook variable.
 *
 * Searches the whole app for `{{variableName}}` (and dotted forms like
 * `{{name.foo}}`) references — across every cell's parameter tree AND every
 * UI block's `data` + `listeners` — and previews each hit with source / path /
 * snippet. On confirm, rewrites each match in place and dispatches
 * `RENAME_VARIABLE`. mobx propagates the rename to every observer (cell
 * headers, variables panel, etc.) automatically.
 */
export const RenameVariableDialog = observer(
	({
		open,
		onOpenChange,
		currentName,
		onRenamed,
	}: RenameVariableDialogProps) => {
		const { state } = useBlocks();
		const inputId = useId();
		const [renameValue, setRenameValue] = useState(currentName);
		const [renameError, setRenameError] = useState<string | null>(null);

		useEffect(() => {
			if (open) {
				setRenameValue(currentName);
				setRenameError(null);
			}
		}, [open, currentName]);

		const affectedRefs = useMemo(
			() => (open ? findVariableReferences(state, currentName) : []),
			[open, currentName, state],
		);

		const affectedSourceCount = useMemo(
			() => countAffectedSources(affectedRefs),
			[affectedRefs],
		);

		const handleRename = async () => {
			const oldName = currentName;
			const newName = renameValue.trim();
			if (!oldName) return;
			if (!newName) {
				setRenameError("Name cannot be empty.");
				return;
			}
			if (newName === oldName) {
				onOpenChange(false);
				return;
			}
			if (!isValidVariableName(newName)) {
				setRenameError(
					"Only letters, numbers, underscores, and hyphens are allowed.",
				);
				return;
			}

			rewriteVariableReferences(state, oldName, newName, affectedRefs);

			const success = await state.dispatch({
				message: ActionMessages.RENAME_VARIABLE,
				payload: {
					id: oldName,
					alias: newName,
				},
			});

			if (success) {
				toast.success(
					`Renamed ${oldName} → ${newName}. Remember to save your app.`,
				);
				onRenamed?.(newName);
				onOpenChange(false);
			} else {
				setRenameError(
					"Couldn't rename — the name may already be in use.",
				);
			}
		};

		return (
			<Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
				<DialogContent className="w-[calc(100vw-2rem)] max-w-[42rem] overflow-hidden sm:max-w-[42rem]">
					<DialogHeader>
						<DialogTitle>Rename variable</DialogTitle>
					</DialogHeader>
					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={inputId}>New name</Label>
							<Input
								id={inputId}
								value={renameValue}
								autoFocus
								placeholder="my_variable"
								onChange={(e) => {
									setRenameValue(e.target.value);
									if (renameError) setRenameError(null);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleRename();
									}
								}}
							/>
							{renameError && (
								<span className="text-destructive text-xs">
									{renameError}
								</span>
							)}
							<span className="text-muted-foreground text-xs">
								Letters, numbers, underscores, and hyphens only.
							</span>
						</div>
						{currentName &&
							(affectedRefs.length > 0 ? (
								<div className="rounded-md border border-border bg-muted/30 px-3 py-2">
									<div className="font-medium text-xs">
										{affectedRefs.length}{" "}
										{affectedRefs.length === 1
											? "reference"
											: "references"}{" "}
										across {affectedSourceCount}{" "}
										{affectedSourceCount === 1
											? "location"
											: "locations"}{" "}
										to{" "}
										<span
											className="font-mono"
											style={noLigatureStyle}
										>
											{`{{${currentName}}}`}
										</span>
										:
									</div>
									<ul className="mt-1.5 flex max-h-48 min-w-0 flex-col gap-1 overflow-y-auto text-xs">
										{affectedRefs.map((hit) => (
											<li
												key={hit.key}
												className="flex min-w-0 flex-col gap-0.5 rounded border border-border/60 bg-background px-2 py-1.5"
											>
												<div className="flex min-w-0 items-center gap-1.5">
													<span className="inline-flex items-center rounded bg-primary/10 px-1 py-0.5 font-medium text-[9px] text-primary uppercase tracking-wider">
														{hit.kind}
													</span>
													<span
														className="font-medium font-mono"
														style={noLigatureStyle}
													>
														{hit.sourceLabel}
													</span>
													<span className="inline-flex items-center rounded bg-muted px-1 py-0.5 font-medium text-[9px] text-muted-foreground uppercase tracking-wider">
														{hit.widget}
													</span>
													<span
														className="truncate font-mono text-[10px] text-muted-foreground"
														style={noLigatureStyle}
													>
														{hit.pathLabel}
													</span>
												</div>
												<code
													className="block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-muted-foreground"
													style={noLigatureStyle}
												>
													{hit.snippet}
												</code>
											</li>
										))}
									</ul>
								</div>
							) : (
								<span className="text-muted-foreground text-xs">
									No other references to{" "}
									<span className="font-mono">
										{`{{${currentName}}}`}
									</span>{" "}
									found.
								</span>
							))}
					</div>
					<DialogFooter>
						<Button
							variant="secondary"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleRename}>
							{affectedRefs.length > 0
								? `Rename & update ${affectedSourceCount} ${affectedSourceCount === 1 ? "location" : "locations"}`
								: "Rename"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
