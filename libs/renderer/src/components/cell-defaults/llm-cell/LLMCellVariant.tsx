import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import { ActionMessages, type QueryState } from "../../../store";
import type { LLMCellDef } from "./LLMCell";

interface CellVariantProps extends LLMCellDef {
	id: string;
	query: QueryState;
}

export interface LLMCellVariantProps {
	allModels: { name: string; id: string }[];
	variantName: string;
	cell: CellVariantProps;
}

export const LLMCellVariant = observer((props: LLMCellVariantProps) => {
	const { allModels, variantName, cell } = props;
	const variant = cell.parameters.variants[variantName];

	const { state } = useBlocks();

	const isDefault = variantName.toLowerCase() === "default";

	const handleModelChange = (id) => {
		const match = allModels.find((model) => model.id === id);
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: cell.query.id,
				cellId: cell.id,
				path: `parameters.variants.${variantName}.model`,
				value: {
					...variant.model,
					id,
					name: match.name,
				},
			},
		});
	};

	const handleModelParamsChange = (value, name) => {
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: cell.query.id,
				cellId: cell.id,
				path: `parameters.variants.${variantName}.model.${name}`,
				value,
			},
		});
	};

	const handleDeleteVariant = () => {
		const variantsCopy = { ...cell.parameters.variants };
		delete variantsCopy[variantName];
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: cell.query.id,
				cellId: cell.id,
				path: "parameters.variants",
				value: variantsCopy,
			},
		});
	};

	return (
		<div>
			<div className="flex items-center justify-between py-4 pb-2">
				<p className="font-semibold text-sm">
					{isDefault
						? "Default Variant"
						: `Variant ${variantName.toUpperCase()}`}
				</p>

				{!isDefault && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleDeleteVariant}
					>
						<X className="size-4" />
					</Button>
				)}
			</div>

			<div className="flex flex-col gap-4 rounded-md bg-card p-4">
				<div className="flex flex-col gap-1.5">
					<p className="text-muted-foreground text-sm">
						Select Model
					</p>
					<Select
						value={variant.model.id}
						onValueChange={(val) => handleModelChange(val)}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select model" />
						</SelectTrigger>
						<SelectContent>
							{allModels.map((model, idx) => (
								<SelectItem
									key={`${model.name}-${idx}`}
									value={model.id}
								>
									{model.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-1.5">
					<p className="text-muted-foreground text-sm">Top P</p>
					<div className="flex flex-row items-center gap-4">
						<Slider
							value={[variant.model.topP]}
							onValueChange={([val]) =>
								handleModelParamsChange(val, "topP")
							}
							min={0}
							max={1}
							step={0.1}
							className="flex-1"
						/>
						<Input
							type="number"
							className="max-w-[72px]"
							value={variant.model.topP}
							onChange={(e) =>
								handleModelParamsChange(e.target.value, "topP")
							}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<p className="text-muted-foreground text-sm">Temperature</p>
					<div className="flex flex-row items-center gap-4">
						<Slider
							value={[variant.model.temperature]}
							onValueChange={([val]) =>
								handleModelParamsChange(val, "temperature")
							}
							min={0}
							max={1}
							step={0.1}
							className="flex-1"
						/>
						<Input
							type="number"
							className="max-w-[72px]"
							value={variant.model.temperature}
							onChange={(e) =>
								handleModelParamsChange(
									e.target.value,
									"temperature",
								)
							}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<p className="text-muted-foreground text-sm">
						Token Length
					</p>
					<div className="flex flex-row items-center gap-4">
						<Slider
							value={[variant.model.length]}
							onValueChange={([val]) =>
								handleModelParamsChange(val, "length")
							}
							min={0}
							max={1024}
							step={1}
							className="flex-1"
						/>
						<Input
							type="number"
							className="max-w-[72px]"
							value={variant.model.length}
							onChange={(e) =>
								handleModelParamsChange(
									e.target.value,
									"length",
								)
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});
