import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Skeleton } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export type BoxShadowParts = {
	offsetX?: string;
	offsetY?: string;
	blurRadius?: string;
	spreadRadius?: string;
	color?: string;
};

export interface ContainerBlockDef extends BlockDef<"container"> {
	widget: "container";
	data: {
		style: CSSProperties;
		show: string;
		loading: boolean | string;
		loadType: string;
		type: "custom" | "grid";
		dimension?: null | string;
		rowSpacing?: null | string;
		boxShadowParts: BoxShadowParts;
	};
	slots: {
		children: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const ContainerBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<ContainerBlockDef>(id);
	const buildBoxShadowFromParts = (parts?: BoxShadowParts): string => {
		if (!parts) return "";

		const safe = (value?: string): string => {
			// Check if the value is defined. If so, trim whitespace and return it.
			// If not, return the default value "0px".
			return value?.trim() || "0px";
		};

		/**
		 * The color of the box shadow. If it doesn't exist, default to "rgba(0,0,0,0.2)"
		 * @type {string}
		 */
		const color = parts?.color?.trim() || "rgba(0,0,0,0.2)";

		/**
		 * The box shadow string. This is constructed by joining the parts of the box
		 * shadow with spaces. The resulting string should look like:
		 * "offset-x offset-y blur-radius spread-radius color"
		 * @type {string}
		 */
		const shadow = [
			safe(parts?.offsetX), // offset-x
			safe(parts?.offsetY), // offset-y
			safe(parts?.blurRadius), // blur-radius
			safe(parts?.spreadRadius), // spread-radius
			color, // color
		].join(" ");

		return shadow as string;
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const isLoading =
		Object.hasOwn(data, "loading") &&
		data.loading?.toString().toLowerCase() === "true";

	if (isLoading && data.loadType === "None (show nothing)") {
		return <div {...attrs} />;
	}

	if (isLoading && data.loadType === "Skeleton") {
		return (
			<div
				style={{
					width: "auto",
					height: "auto",
				}}
				{...attrs}
			>
				<Skeleton className="h-full w-full" />
			</div>
		);
	}

	return (
		<div
			style={{
				...data.style,
				display: "flex",
				overflowWrap: "anywhere", // text that overflows container
				boxShadow: buildBoxShadowFromParts(data.boxShadowParts),
			}}
			{...attrs}
		>
			<Slot slot={slots.children}></Slot>
		</div>
	);
});
