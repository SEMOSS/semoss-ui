import { Copy, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@semoss/ui/next";
import { NotebookIcon } from "@/assets/img/NotebookIcon";

interface NotebookExplorerItemProps {
	id: string;
	isSelected: boolean;
	onClick: (event: React.MouseEvent<HTMLLIElement>) => void;
	onDragStart?: (event: React.DragEvent<HTMLLIElement>) => void;
	onDragEnd?: (event: React.DragEvent<HTMLLIElement>) => void;
	onTrashClick?: () => void;
	onCopyClick?: (newName: string) => void;
}

export const NotebookExplorerItem: React.FC<NotebookExplorerItemProps> =
	observer((props) => {
		const {
			id,
			isSelected = false,
			onClick = () => null,
			onDragStart = () => null,
			onDragEnd = () => null,
			onTrashClick = () => null,
			onCopyClick = () => null,
		} = props;

		const nameInputId = useId();
		const [isDragging, setIsDragging] = useState(false);
		const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
		const [isDeleteOpen, setIsDeleteOpen] = useState(false);
		const [newName, setNewName] = useState("");

		return (
			<>
				<li
					className={`flex h-8 cursor-pointer items-center gap-1 px-4 ${
						isSelected ? "bg-primary/10" : "hover:bg-accent"
					} ${isDragging ? "opacity-50" : ""}`}
					draggable
					onDragStart={(e) => {
						setIsDragging(true);
						onDragStart(e);
					}}
					onDragEnd={(e) => {
						setIsDragging(false);
						onDragEnd(e);
					}}
					onClick={onClick}
					onKeyDown={(e) => e.key === "Enter" && onClick()}
				>
					<span className="shrink-0 text-muted-foreground">
						<NotebookIcon />
					</span>
					<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
						{id}
					</span>
					<div className="flex items-center gap-0">
						<button
							type="button"
							title="Duplicate"
							className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
							onClick={(e) => {
								e.stopPropagation();
								setNewName(`${id} copy`);
								setIsDuplicateOpen(true);
							}}
						>
							<Copy className="h-3.5 w-3.5" />
						</button>
						<button
							type="button"
							title="Delete"
							className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-destructive"
							onClick={(e) => {
								e.stopPropagation();
								setIsDeleteOpen(true);
							}}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				</li>

				<Dialog
					open={isDuplicateOpen}
					onOpenChange={(o) => !o && setIsDuplicateOpen(false)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Duplicate Notebook</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-2">
							<Label htmlFor={nameInputId}>
								New notebook name
							</Label>
							<Input
								id={nameInputId}
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								// biome-ignore lint/suspicious/noExplicitAny: input ref callback
								ref={(input: any) => input?.focus()}
								onKeyDown={(e) => {
									if (e.key === "Enter" && newName.trim()) {
										onCopyClick(newName.trim());
										setIsDuplicateOpen(false);
									}
								}}
							/>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDuplicateOpen(false)}
							>
								Cancel
							</Button>
							<Button
								disabled={!newName.trim()}
								onClick={() => {
									onCopyClick(newName.trim());
									setIsDuplicateOpen(false);
								}}
							>
								Duplicate
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog
					open={isDeleteOpen}
					onOpenChange={(o) => !o && setIsDeleteOpen(false)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Notebook?</DialogTitle>
						</DialogHeader>
						<p className="text-sm">
							This will permanently delete <b>{id}</b>.
						</p>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDeleteOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									onTrashClick();
									setIsDeleteOpen(false);
								}}
							>
								Delete
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	});
