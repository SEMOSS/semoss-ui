import { observer } from "mobx-react-lite";
import { JsonValueViewer } from "@/components/common/json-value-viewer";
import { isOutputJSON } from "@/utility";

interface SuccessOperationProps {
	/** Message returned when there is an error */
	output: string;
}

/**
 * Render the content of a cell in the notebook
 */
export const SuccessOperation = observer(
	(props: SuccessOperationProps): JSX.Element => {
		const { output } = props;

		const value = isOutputJSON(output);
		if (value != null) {
			return <JsonValueViewer value={value} />;
		} else {
			return <span className="text-green-600 text-xs">{output}</span>;
		}
	},
);
