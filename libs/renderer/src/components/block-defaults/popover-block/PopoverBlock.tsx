import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface PopoverBlockDef extends BlockDef<"popover"> {
	widget: "popover";
	data: {
		style: CSSProperties;
		designMode: boolean;
		open: string | boolean | number;
		targetId?: string;
		openTrigger: "click" | "hover";
	};
	slots: {
		header: true;
		content: true;
	};
	listeners: {
		onOpen: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onClose: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const PopoverContentInner: React.FC<{
	data: PopoverBlockDef["data"];
	//biome-ignore lint/suspicious/noExplicitAny: slots's value can't be predicted
	slots: Record<string, any>;
	isStatic: boolean;
}> = observer(({ data, slots, isStatic }) => (
	<div
		style={data.style}
		className="relative z-[2] max-h-[90vh] overflow-auto rounded-md bg-background p-4 shadow-2xl outline-none"
	>
		<div
			className={`min-h-[100px] rounded-md relative${isStatic ? '[&:empty::after]:-translate-x-1/2 [&:empty::after]:-translate-y-1/2 [&:empty::after]:pointer-events-none [&:empty::after]:absolute [&:empty::after]:top-1/2 [&:empty::after]:left-1/2 [&:empty::after]:text-muted-foreground [&:empty::after]:content-["Drop_components_here"]' : ""}`}
		>
			<Slot slot={slots.content} />
		</div>
	</div>
));

export const PopoverBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, setData, listeners } =
		useBlock<PopoverBlockDef>(id);
	const { state } = useBlocks();
	const isStatic = state.mode === "static";
	const targetId = data.targetId || "";

	const open = useMemo(() => {
		return (
			data.open === true ||
			data.open === "true" ||
			data.open === 1 ||
			data.open === "1"
		);
	}, [data.open]);

	const _handleClose = () => {
		if (!isStatic) {
			setData("open", "false");
			listeners.onClose();
		}
	};

	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

	useEffect(() => {
		if (targetId) {
			const element = document.querySelector(
				`[data-block="${targetId}"]`,
			) as HTMLElement | null;
			setAnchorEl(element);
		} else {
			setAnchorEl(null);
		}
	}, [targetId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (!anchorEl) return;

		const handleOpen = () => {
			setAnchorRect(anchorEl.getBoundingClientRect());
			setData("open", "true");
			listeners.onOpen();
		};

		const handleCloseEvt = () => {
			setData("open", "false");
			listeners.onClose();
		};

		if (data.openTrigger === "click") {
			anchorEl.addEventListener("click", handleOpen);
			return () => anchorEl.removeEventListener("click", handleOpen);
		}

		if (data.openTrigger === "hover") {
			anchorEl.addEventListener("mouseenter", handleOpen);
			anchorEl.addEventListener("mouseleave", handleCloseEvt);
			return () => {
				anchorEl.removeEventListener("mouseenter", handleOpen);
				anchorEl.removeEventListener("mouseleave", handleCloseEvt);
			};
		}
	}, [anchorEl, setData, data.openTrigger]);

	const shouldShow = isStatic ? data.designMode : Boolean(open);

	if (!shouldShow && !isStatic) return null;

	// Design mode — inline overlay
	if (isStatic) {
		return (
			<div
				{...attrs}
				style={{
					visibility: shouldShow ? "visible" : "hidden",
					minHeight: shouldShow ? "auto" : "1px",
				}}
			>
				{shouldShow && (
					<>
						<div className="pointer-events-none absolute inset-0 z-[1] bg-black/50" />
						<div className="relative z-[2] mx-auto mt-8 w-fit">
							<PopoverContentInner
								data={data}
								slots={slots}
								isStatic={isStatic}
							/>
						</div>
					</>
				)}
			</div>
		);
	}

	// Interactive mode — portal positioned below anchor
	const pageEl = document.getElementById("page-1") || document.body;

	return (
		<div {...attrs}>
			{createPortal(
				<div
					className="absolute z-[1500]"
					style={
						anchorRect
							? {
									top: anchorRect.bottom + window.scrollY,
									left: anchorRect.left + window.scrollX,
								}
							: { top: 0, left: 0 }
					}
				>
					<PopoverContentInner
						data={data}
						slots={slots}
						isStatic={isStatic}
					/>
				</div>,
				pageEl,
			)}
		</div>
	);
});
