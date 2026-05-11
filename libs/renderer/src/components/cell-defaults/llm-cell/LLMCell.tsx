// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Plus } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Button, toast } from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
	type Variant,
} from "../../../store";
import { LLMCellVariant } from "./LLMCellVariant";

export interface LLMCellDef extends CellDef<"llm"> {
	widget: "llm";
	parameters: {
		command: string;
		variants: { [name: string]: Variant };
	};
}

export const generateVariantName = (currNames: string[]): string | null => {
	const modelled = currNames
		.filter((name) => name.toLowerCase() !== "default")
		.map((name) => name.toLowerCase())
		.sort();

	let charCode = 65,
		newLetter = null;
	for (charCode; charCode < 91; charCode++) {
		const codeAsLetter = String.fromCharCode(charCode).toLowerCase();
		const found = modelled.includes(codeAsLetter);
		if (!found) {
			newLetter = codeAsLetter;
			break;
		}
	}
	return newLetter;
};

export const LLMCell: CellComponent<LLMCellDef> = observer((props) => {
	const { state } = useBlocks();
	const [allModels, setAllModels] = useState<{ name: string; id: string }[]>(
		[],
	);

	const { cell } = props;
	const variants = cell.parameters.variants;
	const command = cell.parameters.command;

	useEffect(() => {
		fetchAllModels();

		if (Object.keys(variants).length === 0) {
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.variants.default",
					value: {
						id: "default",
						to: "",
						sortWeight: 0,
						model: {
							id: "",
							name: "",
							topP: 0,
							temperature: 0,
							length: 0,
						},
					},
				},
			});
		}
	}, []);

	const fetchAllModels = async () => {
		const pixel = `MyEngines(engineTypes=["MODEL"])`;
		const res = await runPixel(pixel);

		const list = res.pixelReturn[0].output as Array<{
			engine_subtype: string;
			engine_type: string;
			engine_name: string;
			engine_id: string;
		}>;

		const modelled = list.map((model) => ({
			name: model.engine_name,
			id: model.engine_id,
		}));
		setAllModels(modelled);
	};

	const handleChange = (newValue, path) => {
		if (cell.isLoading) return;
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: cell.query.id,
				cellId: cell.id,
				path,
				value: newValue,
			},
		});
	};

	const handleAddVariant = () => {
		const newVariantName = generateVariantName(Object.keys(variants));

		if (newVariantName) {
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: `parameters.variants.${newVariantName}`,
					value: {
						id: newVariantName,
						sortWeight: 0,
						model: {
							id: "",
							name: "",
							topP: 0,
							temperature: 0,
							length: 0,
						},
					},
				},
			});
		} else {
			toast.error("The maximum number of variants has been met.");
		}
	};

	return (
		<div
			className="flex w-full flex-col gap-6"
			id={`${cell.query.id} - ${cell.id}`}
		>
			<textarea
				className="min-h-[96px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				value={command}
				placeholder="Command"
				rows={4}
				onChange={(e) =>
					handleChange(e.target.value, "parameters.command")
				}
			/>

			<div className="flex w-full flex-col gap-2">
				<p className="font-bold text-sm">Variants</p>

				<div>
					{Object.keys(variants || {}).map((name) => (
						<LLMCellVariant
							key={`variant-${name}`}
							allModels={allModels}
							variantName={name}
							cell={cell}
						/>
					))}
				</div>

				<div className="flex w-full justify-end gap-2">
					<Button variant="ghost" onClick={handleAddVariant}>
						<Plus className="mr-1 size-4" />
						Add Variant
					</Button>
				</div>
			</div>
		</div>
	);
});
