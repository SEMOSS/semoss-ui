import {
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	FREQUENCY_OPTIONS,
	formatNum,
	parseNum,
	type TokenLimitState,
} from "./token-limit-utils";

interface TokenLimitFieldsProps {
	state: TokenLimitState;
	setField: (field: keyof TokenLimitState, value: string) => void;
	/** Whether any limit is currently set (drives frequency visibility). */
	hasAnyLimit: boolean;
}

export const TokenLimitFields = ({
	state,
	setField,
	hasAnyLimit,
}: TokenLimitFieldsProps) => (
	<div className="flex flex-col gap-3">
		<div className="flex flex-col gap-1.5">
			<Label>
				Combined Token Limit{" "}
				<span className="text-muted-foreground">(optional)</span>
			</Label>
			<Input
				type="text"
				inputMode="numeric"
				placeholder="No limit"
				value={formatNum(state.maxTokens)}
				onChange={(e) =>
					setField("maxTokens", parseNum(e.target.value))
				}
			/>
		</div>
		<div className="flex flex-col gap-1.5">
			<Label>
				Input Token Limit (Prompt){" "}
				<span className="text-muted-foreground">(optional)</span>
			</Label>
			<Input
				type="text"
				inputMode="numeric"
				placeholder="No limit"
				value={formatNum(state.maxInputTokens)}
				onChange={(e) =>
					setField("maxInputTokens", parseNum(e.target.value))
				}
			/>
		</div>
		<div className="flex flex-col gap-1.5">
			<Label>
				Output Token Limit (Response){" "}
				<span className="text-muted-foreground">(optional)</span>
			</Label>
			<Input
				type="text"
				inputMode="numeric"
				placeholder="No limit"
				value={formatNum(state.maxOutputTokens)}
				onChange={(e) =>
					setField("maxOutputTokens", parseNum(e.target.value))
				}
			/>
		</div>
		<div className="flex flex-col gap-1.5">
			<Label>
				Max Compute Time (seconds){" "}
				<span className="text-muted-foreground">(optional)</span>
			</Label>
			<Input
				type="text"
				inputMode="numeric"
				placeholder="No limit"
				value={formatNum(state.maxResponseTime)}
				onChange={(e) =>
					setField("maxResponseTime", parseNum(e.target.value))
				}
			/>
		</div>
		{hasAnyLimit && (
			<div className="flex flex-col gap-1.5">
				<Label>Frequency</Label>
				<Select
					value={state.frequency}
					onValueChange={(v) => setField("frequency", v)}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{FREQUENCY_OPTIONS.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		)}
	</div>
);
