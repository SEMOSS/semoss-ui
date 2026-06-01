import { Plus } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { ExceptionEntry } from "../types";
import { ExceptionRow } from "./exception-row";

export function ExceptionsSection<
	T extends { id: string; name: string; [key: string]: unknown },
>({
	exceptions,
	entityLabel,
	entityOptions,
	renderEntityDetails,
	onAdd,
	onRemove,
	onUpdate,
}: {
	exceptions: ExceptionEntry[];
	entityLabel: string;
	entityOptions: T[];
	renderEntityDetails: (entity: T) => React.ReactNode;
	onAdd: (entity: T) => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, updates: Partial<ExceptionEntry>) => void;
}) {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [selectedEntity, setSelectedEntity] = useState("");

	const availableOptions = entityOptions.filter(
		(o) => !exceptions.some((e) => e.entityId === o.id),
	);

	return (
		<div className="mt-4 rounded-lg border p-4">
			<div className="mb-3 flex items-center justify-between">
				<h4 className="font-medium text-sm">Exceptions</h4>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowAddDialog(true)}
					disabled={availableOptions.length === 0}
				>
					<Plus className="mr-1 size-3" /> Add Exception
				</Button>
			</div>
			{exceptions.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					No exceptions configured. The limits above apply to all{" "}
					{entityLabel.toLowerCase()}s.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{exceptions.map((ex) => (
						<ExceptionRow
							key={ex.entityId}
							exception={ex}
							onRemove={() => onRemove(ex.entityId)}
							onUpdate={(updates) =>
								onUpdate(ex.entityId, updates)
							}
						/>
					))}
				</div>
			)}

			<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add {entityLabel} Exception</DialogTitle>
					</DialogHeader>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
						{availableOptions.map((entity) => (
							<button
								type="button"
								key={entity.id}
								className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
									selectedEntity === entity.id
										? "border-primary bg-accent"
										: ""
								}`}
								onClick={() => setSelectedEntity(entity.id)}
							>
								{renderEntityDetails(entity)}
							</button>
						))}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowAddDialog(false)}
						>
							Cancel
						</Button>
						<Button
							disabled={!selectedEntity}
							onClick={() => {
								const entity = entityOptions.find(
									(o) => o.id === selectedEntity,
								);
								if (entity) {
									onAdd(entity);
								}
								setSelectedEntity("");
								setShowAddDialog(false);
							}}
						>
							Add as Exception
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
