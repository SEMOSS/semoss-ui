import { JsonViewer } from "@textea/json-viewer";
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
					return (
						<JsonViewer
							key={`${i}-${m}`}
							value={value}
							displayDataTypes={true}
							displaySize={true}
							displayComma={true}
							rootName={false}
						/>
					);
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
