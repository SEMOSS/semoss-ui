import { observer } from "mobx-react-lite";
import { JsonValueViewer } from "@/components/common/JsonValueViewer";
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
				return <JsonValueViewer value={value} />;
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
