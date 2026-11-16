import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Spinner,
} from "@semoss/ui/next";

interface ResetStyleDialogProps {
	/** Removes the confirmed style and any proposal waiting for review. */
	onReset: () => Promise<void>;
}

/** Confirms before removing the whole writing style, so a stray click cannot erase it. */
export function ResetStyleDialog({ onReset }: ResetStyleDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline">
					Reset style
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reset your writing style?</DialogTitle>
					<DialogDescription>
						This removes your summary, examples, both audience
						styles, and any proposal waiting for review. Drafts will
						not use a style until you confirm a new one.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex-col sm:flex-row">
					<Button
						type="button"
						variant="outline"
						disabled={isResetting}
						onClick={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isResetting}
						onClick={async () => {
							setIsResetting(true);
							try {
								await onReset();
							} finally {
								setIsResetting(false);
								setIsOpen(false);
							}
						}}
					>
						{isResetting && <Spinner className="size-4" />}
						Reset style
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
