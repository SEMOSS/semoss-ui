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
		<>
			<DialogHeader>
				<DialogTitle>Preview</DialogTitle>
			</DialogHeader>
			<div className="h-[60vh] w-full border border-border">
				<Renderer state={state} />
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
			</DialogFooter>
		</>
	);
});
