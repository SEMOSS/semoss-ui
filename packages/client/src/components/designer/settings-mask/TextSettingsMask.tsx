import { observer } from "mobx-react-lite";
import { useLayoutEffect, useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useDesigner } from "@/hooks";

const FontStyleOptions = [
	{ value: "Roboto", display: "Roboto" },
	{ value: "Helvetica", display: "Helvetica" },
	{ value: "Arial", display: "Arial" },
	{ value: "Times New Roman", display: "Times New Roman" },
	{ value: "Georgia", display: "Georgia" },
];

export const TextSettingsMask = observer(() => {
	const { registry, state } = useBlocks();
	const { designer } = useDesigner();

	const block = state.getBlock(designer.selected);

	const isVisible =
		block && registry[block.widget] && block.widget !== "page";

	const [value, setValue] = useState<{
		fontFamily: string;
		fontSize: number | null;
	}>({
		fontFamily: "",
		fontSize: null,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — sync on block selection change
	useLayoutEffect(() => {
		if (!isVisible || block.widget !== "text") {
			return;
		}
		// biome-ignore lint/suspicious/noExplicitAny: suppressed as part of merge
		const blockStyle: any = block.data.style;
		if (blockStyle) {
			const { fontFamily: ff, fontSize: fs } = blockStyle;
			setValue({
				fontFamily: ff ?? "",
				fontSize:
					fs && fs !== "revert" ? Number(fs.replace("px", "")) : null,
			});
		}
	}, [designer.selected, isVisible]);

	const onChange = (
		path: string,
		newValue: string | number,
		isValid: boolean,
	) => {
		if (!path) {
			console.log("Invalid path passed!");
			return;
		}
		setValue({ ...value, [path]: newValue });

		if (isValid) {
			state.dispatch({
				message: ActionMessages.SET_BLOCK_DATA,
				payload: {
					id: block.id,
					path: `style.${path}`,
					value: path === "fontSize" ? `${newValue}px` : newValue,
				},
			});
		}
	};

	const hasFontSizeError =
		value.fontSize !== null && (value.fontSize < 8 || value.fontSize > 94);

	return (
		<div
			className="flex items-center gap-2 rounded bg-white p-2"
			style={{
				boxShadow:
					"0px 5px 22px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
			}}
		>
			<Select
				value={value.fontFamily || undefined}
				onValueChange={(newValue) =>
					onChange("fontFamily", newValue, true)
				}
			>
				<SelectTrigger className="w-[70%]">
					<SelectValue placeholder="Font Style" />
				</SelectTrigger>
				<SelectContent>
					{FontStyleOptions.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.display}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div className="h-8 border-l" />

			<Input
				type="number"
				className={`w-[30%] ${hasFontSizeError ? "border-destructive" : ""}`}
				placeholder="Size"
				min={8}
				max={94}
				value={value.fontSize ?? ""}
				onChange={(e) => {
					const isValid =
						Number(e.target.value) >= 8 &&
						Number(e.target.value) <= 94;
					onChange("fontSize", e.target.value, isValid);
				}}
			/>
		</div>
	);
});
