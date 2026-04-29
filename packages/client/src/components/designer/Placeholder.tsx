import { observer } from "mobx-react-lite";
import { useDesigner } from "@/hooks";
import type { DesignerStoreInterface } from "@/stores";

function getPlaceholderStyle(
	placeholderAction: DesignerStoreInterface["drag"]["placeholderAction"],
	placeholderSize: DesignerStoreInterface["drag"]["placeholderSize"],
) {
	const spacer = 3;

	if (!placeholderAction || !placeholderSize) {
		return {
			display: "none",
		};
	}

	const { type } = placeholderAction;

	if (type === "before") {
		return {
			top: `${placeholderSize.top - spacer / 2}px`,
			left: `${placeholderSize.left}px`,
			height: `${spacer}px`,
			width: `${placeholderSize.width}px`,
			opacity: 1,
		};
	} else if (type === "after") {
		return {
			top: `${placeholderSize.top + placeholderSize.height - spacer / 2}px`,
			left: `${placeholderSize.left}px`,
			height: `${spacer}px`,
			width: `${placeholderSize.width}px`,
			opacity: 1,
		};
	} else if (type === "replace") {
		return {
			top: `${placeholderSize.top}px`,
			left: `${placeholderSize.left}px`,
			height: `${placeholderSize.height}px`,
			width: `${placeholderSize.width}px`,
			opacity: 0.3,
		};
	}

	return {};
}

export const Placeholder = observer(() => {
	const { designer } = useDesigner();

	if (!designer.drag.placeholderAction || !designer.drag.placeholderSize) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute z-20 select-none bg-primary"
			style={{
				...getPlaceholderStyle(
					designer.drag.placeholderAction,
					designer.drag.placeholderSize,
				),
			}}
		/>
	);
});
