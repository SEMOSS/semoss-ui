import { JsonValueViewer } from "@/components/common/json-value-viewer";
import { isOutputJSON } from "@/utility/general";

interface ConsoleProps {
	/**
	 * Messages for each Cell
	 */
	messages: string[];
}

export const NotebookCellConsole = (props: ConsoleProps) => {
	const { messages } = props;
	return (
		<div className="flex flex-col">
			{messages.map((m, i) => {
				const value = isOutputJSON(m);
				if (value != null) {
					return <JsonValueViewer key={`${i}-${m}`} value={value} />;
				} else {
					return (
						<span key={`${i}-${m}`} className="text-xs">
							{m}
						</span>
					);
				}
			})}
		</div>
	);
};
