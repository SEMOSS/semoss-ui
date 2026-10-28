import { CircleDashed, RotateCcw } from "lucide-react";
import type { ReactElement } from "react";
import { Badge, Button, Muted, TableCell, TableRow } from "@semoss/ui/next";
import { ServedModelEnginesCell } from "./served-model-engines-cell";
import type { MissingServedModel } from "./use-served-model-engines";

export interface MissingServedModelRowProps {
	missing: MissingServedModel;
	/** Opens the definition form under the model's name */
	onDefineAgain: (missing: MissingServedModel) => void;
}

/**
 * A row for a served model that is gone from the cluster while engines are
 * still linked to it, such as one deleted with kubectl: it says so, names its
 * engines, and offers to define it again under the same name.
 */
export function MissingServedModelRow({
	missing,
	onDefineAgain,
}: MissingServedModelRowProps): ReactElement {
	return (
		<TableRow className="align-top">
			<TableCell className="max-w-64 whitespace-normal">
				<span className="break-all font-medium">
					{missing.servedModel}
				</span>
			</TableCell>
			<TableCell className="min-w-56 max-w-80 whitespace-normal">
				<div className="flex min-w-0 flex-col items-start gap-1.5">
					<Badge variant="outline" className="gap-1">
						<CircleDashed
							className="size-3.5 text-muted-foreground"
							aria-hidden
						/>
						Not in the cluster
					</Badge>
					<Muted className="text-xs">
						Its InferenceService was deleted outside SEMOSS, such as
						with kubectl delete. Define it again under this name, or
						apply the manifest it came from again, and its engines
						answer again.
					</Muted>
				</div>
			</TableCell>
			<TableCell>
				<Muted className="text-xs">None</Muted>
			</TableCell>
			<TableCell className="max-w-56 whitespace-normal">
				<ServedModelEnginesCell
					group={{ linked: missing.engines, unlinked: [] }}
					isUnknown={false}
				/>
			</TableCell>
			<TableCell>
				<Muted className="text-xs">Not recorded</Muted>
			</TableCell>
			<TableCell>
				<div className="flex justify-end">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onDefineAgain(missing)}
						aria-label={`Define ${missing.servedModel} again`}
					>
						<RotateCcw className="size-4" aria-hidden />
						Define Again...
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}
