import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, type FC, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@semoss/ui/next";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface ModalBlockDef extends BlockDef<"modal"> {
	widget: "modal";
	data: {
		style: CSSProperties;
		title: string;
		fullWidth: boolean;
		maxWidth: "xs" | "sm" | "md" | "lg" | "xl";
		minWidth: "xs" | "sm" | "md" | "lg" | "xl";
		designMode: boolean;
		open: string | boolean | number;
	};
	slots: {
		content: true;
		footer: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onClose: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const widthMap: Record<"xs" | "sm" | "md" | "lg" | "xl", string> = {
	xs: "444px",
	sm: "600px",
	md: "900px",
	lg: "1200px",
	xl: "1536px",
};

const ModalContent: FC<{
	data: ModalBlockDef["data"];
	//biome-ignore lint/suspicious/noExplicitAny: slots's value can't be predicted
	slots: Record<string, any>;
	onClose?: () => void;
	isStatic: boolean;
}> = observer(({ data, slots, onClose, isStatic }) => {
	const minWidth = widthMap[data.minWidth] ?? "444px";
	const maxWidth = data.fullWidth
		? (widthMap[data.maxWidth] ?? undefined)
		: undefined;

	return (
		<div
			style={{ minWidth, maxWidth, ...data.style }}
			className="relative z-[2] max-h-[90vh] overflow-auto rounded-md bg-background p-8 shadow-2xl outline-none"
		>
			<div className="mb-4 flex items-center justify-between border-b pb-2">
				<h2 className="font-semibold text-lg">{data.title}</h2>
				{onClose && (
					<Button variant="ghost" size="icon-sm" onClick={onClose}>
						<X className="size-4" />
					</Button>
				)}
			</div>

			<div
				className={`min-h-[100px] rounded-md border border-primary border-dashed p-4 relative${isStatic ? '[&:empty::after]:-translate-x-1/2 [&:empty::after]:-translate-y-1/2 [&:empty::after]:pointer-events-none [&:empty::after]:absolute [&:empty::after]:top-1/2 [&:empty::after]:left-1/2 [&:empty::after]:text-muted-foreground [&:empty::after]:content-["Drop_components_here"]' : ""}`}
			>
				<Slot slot={slots.content} />
			</div>

			<div className="mt-6 border-t pt-4">
				<Slot slot={slots.footer} />
			</div>
		</div>
	);
});

export const ModalBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<ModalBlockDef>(id);
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
		}
	}, [data.open]);

	const open = useMemo(() => {
		return (
			data.open === true ||
			data.open === "true" ||
			data.open === "True" ||
			data.open === 1 ||
			data.open === "1"
		);
	}, [data.open]);

	const handleClose = () => {
		if (!isStatic) {
			listeners.onClose();
		}
	};

	const shouldShowModal = isStatic ? data.designMode : open;

	if (!shouldShowModal && !isStatic) {
		return null;
	}

	// In static (design) mode — inline overlay without portal
	if (isStatic) {
		return (
			<div
				{...attrs}
				style={{
					visibility: shouldShowModal ? "visible" : "hidden",
					minHeight: shouldShowModal ? "auto" : "1px",
				}}
			>
				{shouldShowModal && (
					<>
						<div className="pointer-events-none absolute inset-0 z-[1] bg-black/50" />
						<div className="relative z-[2] mx-auto mt-8 w-fit">
							<ModalContent
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

	// Interactive mode — portal to #page-1
	const container = (() => {
		const elements = Array.from(document.querySelectorAll('[id="page-1"]'));
		return (elements.at(-1) as HTMLElement) || document.body;
	})();

	return (
		<div {...attrs}>
			{createPortal(
				<div
					className="absolute inset-0 z-[1500] flex items-center justify-center"
					style={{ position: "absolute" }}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: interactive overlay with click handler */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: click-only interaction by design */}
					<div
						className="absolute inset-0 bg-black/50"
						onClick={handleClose}
					/>
					<ModalContent
						data={data}
						slots={slots}
						onClose={handleClose}
						isStatic={isStatic}
					/>
				</div>,
				container,
			)}
		</div>
	);
});
