import { observer } from "mobx-react-lite";
import { Renderer, type SerializedState } from "@semoss/renderer";
import {
	Button,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface PreviewOverlayProps {
	/** State to load in the preview */
	state: SerializedState;

	/** Method called to close overlay  */
	onClose: () => void;
}

export const PreviewOverlay = observer((props: PreviewOverlayProps) => {
	const { state, onClose = () => null } = props;

	return (
		<div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden p-6">
			<DialogHeader>
				<DialogTitle>Preview</DialogTitle>
			</DialogHeader>
			<div className="relative h-[70vh] w-full min-w-0 max-w-full overflow-auto rounded-md border border-border bg-background">
				<Renderer state={state} />
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
			</DialogFooter>
		</div>
	);
});
