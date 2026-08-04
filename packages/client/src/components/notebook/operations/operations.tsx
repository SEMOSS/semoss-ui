import { observer } from "mobx-react-lite";
import type { CellState } from "@semoss/renderer";
import { DefaultOperation } from "./default-operation";
import { ErrorOperation } from "./ErrorOperation";
import { FrameOperation } from "./frame-operation";
import { SuccessOperation } from "./success-operation";
import { WarningOperation } from "./WarningOperation";

interface OperationProps {
	/**
	 * Operation controls the view that will be rendered
	 */
	operation: CellState["operation"][number];

	/**
	 * Output used by the operation
	 */
	output: CellState["output"];

	/**
	 * cell Data on
	 */
	cellData?: {
		cellId: string;
		queryId: string;
	};

	/** Controlled expand-all forwarded to the JSON viewer for DefaultOperation. */
	expandAll?: boolean;
	/** Hide the JSON viewer's built-in expand-all toggle. */
	hideJsonToggle?: boolean;
	/** Reserve fully-expanded height in the JSON viewer (modal contexts). */
	fixedJsonHeight?: boolean;
	/** Height cap for inline images; modal contexts pass `max-h-none`. */
	imageClassName?: string;
}

/**
 * Operation that is rendered
 */
export const Operation = observer((props: OperationProps): JSX.Element => {
	const {
		operation,
		output,
		expandAll,
		hideJsonToggle,
		fixedJsonHeight,
		imageClassName,
	} = props;

	if (operation === "SUCCESS") {
		return <SuccessOperation output={output as string} />;
	} else if (operation === "WARNING") {
		return <WarningOperation output={output as string} />;
	} else if (operation === "ERROR") {
		return <ErrorOperation output={output as string} />;
	} else if (operation === "FRAME_DATA_CHANGE") {
		return (
			<FrameOperation
				output={
					output as {
						name: string;
						type: "NATIVE" | "PY" | "GRID" | "R";
					}
				}
				cellData={props.cellData}
			/>
		);
	} else if (operation === "FRAME_FILTER_CHANGE") {
		return (
			<FrameOperation
				output={
					output as {
						name: string;
						type: "NATIVE" | "PY" | "GRID" | "R";
					}
				}
				cellData={props.cellData}
			/>
		);
	}

	return (
		<DefaultOperation
			output={output}
			expandAll={expandAll}
			hideJsonToggle={hideJsonToggle}
			fixedJsonHeight={fixedJsonHeight}
			imageClassName={imageClassName}
		/>
	);
});
