import { observer } from "mobx-react-lite";
import { useDesigner } from "@/hooks";
import type { DesignerStoreInterface } from "@/stores";

/**
 * Calculate the size of the ghost
 */
function getGhostStyle(
	ghostPosition: DesignerStoreInterface["drag"]["ghostPosition"],
) {
	const spacer = 3;

	if (!ghostPosition) {
		return {
			display: "none",
		};
	}

	return {
		top: `${ghostPosition.y + spacer}px`,
		left: `${ghostPosition.x + spacer}px`,
	};
}

/**
 * Rendered Dragged Item
 */
export const Ghost = observer(() => {
	const { designer } = useDesigner();

	if (!designer.drag.ghostPosition) {
		return null;
	}

	return (
		<div
			className="pointer-events-auto fixed z-20 flex cursor-grabbing select-none items-center whitespace-nowrap px-2"
			style={{
				...getGhostStyle(designer.drag.ghostPosition),
			}}
		>
			<div className="rounded-lg border border-primary px-4 py-1 opacity-50">
				<div className="flex flex-col items-center justify-center gap-2 p-2">
					<div>
						<img
							src={designer.drag.ghostIcon}
							alt="ghost-image"
							width={50}
							height={50}
						/>
					</div>
					<span className="text-xs capitalize">
						{designer.drag.ghostDisplay}
					</span>
				</div>
			</div>
		</div>
	);
});
