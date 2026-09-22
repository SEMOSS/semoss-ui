import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";
import { getImageMimeType } from "../../utility/file-editor.utility";

/** Preview an image file from a project, engine, or insight resource. */
export const FileImageView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });

	useFileViewControls(onControls, {
		canSave: false,
		isBusy: panel.isBusy,
		refresh: panel.read.refresh,
	});

	if (panel.gate) return panel.gate;
	if (panel.readGate) return panel.readGate;

	return (
		<div className="relative size-full items-center justify-center overflow-hidden bg-background p-4">
			<div className="flex size-full items-center justify-center">
				<img
					className="max-h-full max-w-full object-contain"
					src={`data:${getImageMimeType(config.path)};base64,${panel.read.data}`}
					alt={`Preview of ${config.name}`}
				/>
			</div>
		</div>
	);
};
