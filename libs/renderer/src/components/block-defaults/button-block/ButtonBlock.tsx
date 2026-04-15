import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Button, Spinner } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ButtonBlockDef extends BlockDef<"button"> {
	widget: "button";
	data: {
		style: CSSProperties;
		label: string;
		loading?: boolean;
		disabled?: boolean;
		variant: "contained" | "outlined" | "text";
		color: "primary" | "secondary" | "success" | "warning" | "error";
		show: string;
		type: "button" | "submit" | "reset";
	};
	listeners: {
		onClick: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const mapVariant = (
	variant: "contained" | "outlined" | "text",
): "default" | "outline" | "ghost" => {
	const variantMap: Record<
		"contained" | "outlined" | "text",
		"default" | "outline" | "ghost"
	> = {
		contained: "default",
		outlined: "outline",
		text: "ghost",
	};
	return variantMap[variant] || "default";
};

export const ButtonBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	return (
		<div {...attrs} style={{ padding: "0.25rem", ...data.style }}>
			<Button
				variant={mapVariant(data.variant)}
				disabled={data?.disabled || data?.loading}
				type={data?.type}
				className="relative"
				onClick={() => {
					listeners.onClick();
				}}
			>
				<span
					style={{
						visibility: data?.loading ? "hidden" : "visible",
					}}
				>
					{data.label}
				</span>
				{data.loading && (
					<span className="absolute inset-0 flex items-center justify-center">
						<Spinner className="size-4" />
					</span>
				)}
			</Button>
		</div>
	);
});
