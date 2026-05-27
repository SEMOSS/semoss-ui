import { observer } from "mobx-react-lite";
import { JsonValueViewer } from "@/components/common/json-value-viewer";
import { isOutputJSON } from "@/utility";

interface DefaultOperationProps {
	/** Output of the code */
	output: unknown;
	/** Controlled expand-all state forwarded to the JSON viewer. */
	expandAll?: boolean;
	/** Hide the JSON viewer's built-in expand-all toggle. */
	hideJsonToggle?: boolean;
	/** Reserve fully-expanded height in the JSON viewer (modal contexts). */
	fixedJsonHeight?: boolean;
}

/**
 * Render the default JSON of the operation
 */
export const DefaultOperation = observer(
	(props: DefaultOperationProps): JSX.Element => {
		const { output, expandAll, hideJsonToggle, fixedJsonHeight } = props;

		if (typeof output === "string" || typeof output === "object") {
			const value = isOutputJSON(output);
			if (value != null) {
				return (
					<JsonValueViewer
						value={value}
						expandAll={expandAll}
						hideToggle={hideJsonToggle}
						fixedHeight={fixedJsonHeight}
					/>
				);
			} else {
				return (
					<pre className="max-h-[200px] overflow-y-scroll text-wrap text-sm">
						{output as string}
					</pre>
				);
			}
		}

		return (
			<pre className="max-h-[200px] overflow-y-scroll text-wrap text-sm">
				{JSON.stringify(output, null, 4)}
			</pre>
		);
	},
);
