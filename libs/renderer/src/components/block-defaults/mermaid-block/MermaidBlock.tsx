import mermaid from "mermaid";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";

export interface MermaidBlockDef extends BlockDef<"mermaid"> {
	widget: "mermaid";
	data: {
		text: string;
	};
	slots: never;
}

export const MermaidBlock: BlockComponent = observer(({ id }) => {
	const { data, attrs } = useBlock<MermaidBlockDef>(id);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	mermaid.initialize({ startOnLoad: false });

	const handleMermaidError = (elemId: string, error: Error) => {
		const element = document.getElementById(elemId);
		if (element) {
			element.innerHTML = `<div style="color: red; font-weight: bold;">Mermaid Error: ${error.message}</div>`;
		}
	};

	const isMermaidSyntaxValid = async (text: string): Promise<boolean> => {
		try {
			await mermaid.parse(text);
			return true;
		} catch {
			return false;
		}
	};

	const initializeMermaid = (elemId: string, text: string) => {
		const element = document.getElementById(elemId);
		if (element) {
			try {
				element.removeAttribute("data-processed");
				element.innerHTML = text;
				mermaid.init(undefined, element);
			} catch (error) {
				handleMermaidError(elemId, error as Error);
			}
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		const renderMermaid = async () => {
			if (!data.text) {
				setErrorMessage(null);
				return;
			}
			if (!(await isMermaidSyntaxValid(data.text))) {
				setErrorMessage("Invalid Mermaid syntax");
				return;
			}
			setErrorMessage(null);
			initializeMermaid(id, data.text);
		};
		renderMermaid();
	}, [id, data.text]);

	return (
		<div {...attrs}>
			<div
				className="mermaid-container h-fit w-fit"
				id={`mermaid-container-${id}`}
			>
				<pre
					className="mermaid"
					id={id}
					style={{
						display: errorMessage || !data.text ? "none" : "block",
					}}
				>
					{data.text}
				</pre>
			</div>
			{errorMessage && (
				<Alert variant="destructive">
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}
			{!data.text && <div />}
		</div>
	);
});
