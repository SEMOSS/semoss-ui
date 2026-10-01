import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { ParallelConfig } from "../../../domain/automation.types";

interface ParallelNodeFormProps {
	config: ParallelConfig;
	availableJoinNodes: Array<{ id: string; label: string }>;
	parallelBranchCount: number;
	onChange: (config: ParallelConfig) => void;
	readOnly?: boolean;
}

const NO_JOIN_VALUE = "__no_join__";

export function ParallelNodeForm({
	config,
	availableJoinNodes = [],
	parallelBranchCount,
	onChange,
	readOnly = false,
}: ParallelNodeFormProps) {
	const hasCurrentJoin = availableJoinNodes.some(
		(join) => join.id === config.joinNodeId,
	);

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground text-xs">
				Branches: {parallelBranchCount}
			</p>
			<Field>
				<FieldLabel>Join branches</FieldLabel>
				<Select
					value={config.joinNodeId || NO_JOIN_VALUE}
					onValueChange={(joinNodeId) =>
						onChange({
							...config,
							joinNodeId:
								joinNodeId === NO_JOIN_VALUE ? "" : joinNodeId,
						})
					}
					disabled={readOnly}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a join node" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NO_JOIN_VALUE}>
							No join (terminal branches)
						</SelectItem>
						{config.joinNodeId && !hasCurrentJoin && (
							<SelectItem value={config.joinNodeId}>
								Unavailable join ({config.joinNodeId})
							</SelectItem>
						)}
						{availableJoinNodes.map((join) => (
							<SelectItem key={join.id} value={join.id}>
								{join.label || "Parallel join"}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<p className="text-muted-foreground text-xs">
				Choose a join to wait for every branch. Without one, branches
				must be terminal side effects.
			</p>
		</div>
	);
}
