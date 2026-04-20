import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo } from "react";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface SidebarBlockDef extends BlockDef<"sidebar"> {
	widget: "sidebar";
	data: {
		style: CSSProperties;
		anchor: "left" | "top";
		designMode: boolean;
		open: string | boolean | number; // Changed to string to store query
	};
	slots: {
		content: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		postProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const SidebarBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<SidebarBlockDef>(id);
	const { state } = useBlocks();
	const isStatic = state.mode === "static";

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (
			data.open === true ||
			data.open === "true" ||
			data.open === "True" ||
			data.open === 1 ||
			data.open === "1"
		) {
			if (listeners.preProcess) {
				listeners.preProcess();
			}
		} else {
			if (listeners.postProcess) {
				listeners.postProcess();
			}
		}
	}, [data.open]);

	const open = useMemo(() => {
		let o = false;
		// Interpret Python
		if (
			data.open === true ||
			data.open === "true" ||
			data.open === 1 ||
			data.open === "1"
		) {
			o = true;
		}

		return o;
	}, [data.open]);

	// Helper to determine if sidebar should be shown
	const shouldShowSidebar = isStatic
		? data.designMode // In static mode, show when design mode is on
		: Boolean(open); // In interactive mode, show when query returns true

	const isTop = data.anchor === "top";

	const panelStyle: CSSProperties = {
		position: "absolute",
		zIndex: !isStatic ? 40 : 19,
		height: isTop ? undefined : (data.style.height ?? "100%"),
		width: isTop ? "100%" : data.style.width,
		top: isTop ? 0 : undefined,
		left: isTop ? undefined : 0,
		transition: "transform 250ms ease",
		transform: shouldShowSidebar
			? "translate(0, 0)"
			: isTop
				? "translateY(-100%)"
				: "translateX(-100%)",
		overflow: "hidden",
		...data.style,
	};

	return (
		<div {...attrs} style={panelStyle}>
			<div>
				<Slot slot={slots.content} />
			</div>
		</div>
	);
});
