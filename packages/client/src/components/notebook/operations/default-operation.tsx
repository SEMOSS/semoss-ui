import { observer } from "mobx-react-lite";
import { hasInlineImage, InlineImageSegments } from "@semoss/shared";
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
	/**
	 * Height cap applied to inline images. The inline cell body scrolls at
	 * 300px, so figures are capped below that; the expand modal passes
	 * `max-h-none` to show them at full size.
	 */
	imageClassName?: string;
}

/**
 * Render the default JSON of the operation
 */
export const DefaultOperation = observer(
	(props: DefaultOperationProps): JSX.Element => {
		const {
			output,
			expandAll,
			hideJsonToggle,
			fixedJsonHeight,
			imageClassName = "max-h-[260px]",
		} = props;

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
				// A Python cell returns its rendered figures as inline base64
				// images. Show the picture here; the cell's Raw toggle bypasses
				// this component entirely and prints the underlying html.
			} else if (typeof output === "string" && hasInlineImage(output)) {
				return (
					<InlineImageSegments
						text={output}
						textClassName="whitespace-pre-wrap break-all text-sm"
						imageClassName={imageClassName}
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
