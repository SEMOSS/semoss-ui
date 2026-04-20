import { JsonViewer } from "@textea/json-viewer";
import { observer } from "mobx-react-lite";
import { isOutputJSON } from "@/utility";

interface DefaultOperationProps {
	/** Output of the code */
	output: unknown;
}

/**
 * Render the default JSON of the operation
 */
export const DefaultOperation = observer(
	(props: DefaultOperationProps): JSX.Element => {
		const { output } = props;

		if (typeof output === "string" || typeof output === "object") {
			const value = isOutputJSON(output);
			if (value != null) {
				return (
					<JsonViewer
						value={value}
						displayComma={true}
						rootName={false}
					/>
				);
			} else {
				return (
					<pre className="max-h-[200px] overflow-y-scroll text-sm [text-wrap:wrap]">
						{output as string}
					</pre>
				);
			}
		}

		return (
			<pre className="max-h-[200px] overflow-y-scroll text-sm [text-wrap:wrap]">
				{JSON.stringify(output, null, 4)}
			</pre>
		);
	},
);
