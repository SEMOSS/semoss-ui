import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface LogsBlockDef extends BlockDef<"logs"> {
	widget: "logs";
	data: {
		style: CSSProperties;
		queryId: string;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const LogsBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<LogsBlockDef>(id);
	const { state } = useBlocks();

	const notebook = state.getNotebook(data.queryId);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	if (!notebook) {
		return (
			<div style={{ display: "flex", ...data.style }} {...attrs}>
				Attach Notebook
			</div>
		);
	}

	const blockContents: string[] = [];
	if (notebook.cells) {
		Object.values(notebook.cells).forEach((cell) => {
			if (cell.messages) {
				blockContents.push(...cell.messages);
			}
		});
	}

	return (
		<div
			style={{ display: "flex", ...data.style }}
			{...attrs}
			className="flex flex-col"
		>
			{blockContents.map((message, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available for log entries
				<span key={index} className="text-xs">
					{message}
				</span>
			))}
		</div>
	);
});
