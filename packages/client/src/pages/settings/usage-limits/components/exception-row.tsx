import { Save, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	toast,
} from "@semoss/ui/next";
import { TIME_PERIOD_LABELS } from "../constants";
import type { ExceptionEntry, TimePeriod } from "../types";

export function ExceptionRow({
	exception,
	onRemove,
	onUpdate,
}: {
	exception: ExceptionEntry;
	onRemove: () => void;
	onUpdate: (updates: Partial<ExceptionEntry>) => void;
}) {
	const [localCombined, setLocalCombined] = useState(
		String(exception.combinedLimit),
	);
	const [localInput, setLocalInput] = useState(String(exception.inputLimit));
	const [localOutput, setLocalOutput] = useState(
		String(exception.outputLimit),
	);
	const [localPeriod, setLocalPeriod] = useState(exception.period);
	const [localActive, setLocalActive] = useState(exception.isActive);

	const isDirty =
		localCombined !== String(exception.combinedLimit) ||
		localInput !== String(exception.inputLimit) ||
		localOutput !== String(exception.outputLimit) ||
		localPeriod !== exception.period ||
		localActive !== exception.isActive;

	const handleSave = () => {
		onUpdate({
			combinedLimit: parseInt(localCombined, 10) || 0,
			inputLimit: parseInt(localInput, 10) || 0,
			outputLimit: parseInt(localOutput, 10) || 0,
			period: localPeriod,
			isActive: localActive,
		});
		toast.success("Exception updated");
	};

	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
			<div className="flex flex-1 flex-col gap-2">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span className="font-medium text-sm">
						{exception.entityName}
					</span>
					{exception.entityDetails.map((d) => (
						<span
							key={d.label}
							className="text-muted-foreground text-xs"
						>
							<span className="font-medium">{d.label}:</span>{" "}
							{d.value}
						</span>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-1.5">
						<Label className="whitespace-nowrap text-xs">
							Combined:
						</Label>
						<Input
							type="number"
							value={localCombined}
							onChange={(e) => setLocalCombined(e.target.value)}
							className="h-7 w-24 text-xs"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<Label className="whitespace-nowrap text-xs">
							Input:
						</Label>
						<Input
							type="number"
							value={localInput}
							onChange={(e) => setLocalInput(e.target.value)}
							className="h-7 w-24 text-xs"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<Label className="whitespace-nowrap text-xs">
							Output:
						</Label>
						<Input
							type="number"
							value={localOutput}
							onChange={(e) => setLocalOutput(e.target.value)}
							className="h-7 w-24 text-xs"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<Label className="text-xs">Period:</Label>
						<Select
							value={localPeriod}
							onValueChange={(v: TimePeriod) => setLocalPeriod(v)}
						>
							<SelectTrigger className="h-7 w-24 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(
									Object.keys(
										TIME_PERIOD_LABELS,
									) as TimePeriod[]
								).map((p) => (
									<SelectItem key={p} value={p}>
										{TIME_PERIOD_LABELS[p]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-1.5">
						<Label className="text-xs">Active:</Label>
						<Switch
							checked={localActive}
							onCheckedChange={setLocalActive}
						/>
					</div>
				</div>
			</div>
			<div className="flex shrink-0 flex-col items-center gap-1">
				{isDirty && (
					<Button
						variant="ghost"
						size="icon"
						className="size-7 text-primary"
						onClick={handleSave}
						title="Save changes"
					>
						<Save className="size-3.5" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-destructive"
					onClick={onRemove}
					title="Remove exception"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}
