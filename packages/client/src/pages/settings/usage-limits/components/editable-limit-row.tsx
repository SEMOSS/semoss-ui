import { Save, Trash2 } from "lucide-react";
import { Button } from "@semoss/ui/next";

export function EditableLimitRow({
	children,
	onDelete,
	onSave,
	isDirty,
}: {
	children: React.ReactNode;
	onDelete: () => void;
	onSave: () => void;
	isDirty: boolean;
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
			<div className="flex flex-1 flex-wrap items-center gap-3">
				{children}
			</div>
			<div className="flex shrink-0 items-center gap-1">
				{isDirty && (
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						onClick={onSave}
						title="Save changes"
					>
						<Save className="size-4" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive"
					onClick={onDelete}
					title="Remove"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		</div>
	);
}
