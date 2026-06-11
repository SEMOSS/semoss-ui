import { Check } from "lucide-react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

export function AddLimitDialog({
	open,
	onOpenChange,
	onConfirm,
	children,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onConfirm: () => void;
	children: React.ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Limit</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">{children}</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={onConfirm}>
						<Check className="mr-1 size-3" /> Save Limit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
