import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Renderer,
	type SerializedState,
	useBlocks,
	type Variable,
} from "@semoss/renderer";
import { Separator } from "@semoss/ui/next";
import PreviewButton from "@/assets/img/PreviewRounded.png";
import { JsonValueViewer } from "@/components/common/json-value-viewer";
import { capitalizeFirstLetter, isOutputJSON } from "@/utility";

interface VariablePreviewProps {
	/**
	 * Which variable to preview
	 */
	variable: Variable;

	/**
	 * id of the variable
	 */
	id: string;
}

export const VariablePreview = observer(
	(props: VariablePreviewProps): JSX.Element => {
		const { variable, id } = props;
		const { state } = useBlocks();

		/**
		 * To show Preview of Block
		 * @param to what block to render
		 * @returns Serialized State
		 */
		const getStateWithBlock = (to: string) => {
			try {
				const block = state.getBlock(to);
				const s: SerializedState = {
					version: "1.0.0-alpha.3",
					executionOrder: [],
					variables: {},
					queries: {},
					blocks: {
						"page-1": {
							id: "page-1",
							widget: "page",
							parent: null,
							data: {
								style: {
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									backgroundColor: "#FAFAFA",
								},
							},
							listeners: {
								onPageLoad: {
									type: "sync",
									order: [],
								},
							},
							slots: {
								content: {
									name: "content",
									children: [to],
								},
							},
						},
						[to]: {
							id: block.id,
							widget: block.widget,
							data: block.data,
							parent: null,
							listeners: block.listeners,
							slots: block.slots,
						},
					},
				};

				return s;
			} catch {
				return null;
			}
		};

		const preview = useMemo(() => {
			if (variable.type === "block") {
				const config = getStateWithBlock(variable.to);
				if (config) {
					return (
						<div className="relative w-[350px] min-w-0 overflow-hidden">
							<Renderer state={config} preview={true} />
						</div>
					);
				} else {
					return (
						<span className="font-bold text-destructive text-sm">
							Block is no longer available
						</span>
					);
				}
			} else {
				const found = state.parseVariable(`{{${id}}}`);
				const value = isOutputJSON(found);
				if (value != null) {
					return <JsonValueViewer value={value} />;
				} else {
					return (
						<span className="text-muted-foreground text-sm">
							{found as string}
						</span>
					);
				}
			}
		}, [variable, id]);

		const previewValue = useMemo(() => {
			let val: string;

			if (variable.type === "block") {
				try {
					val = state.getBlock(variable.to).data?.value;
				} catch {
					val = "undefined";
				}
			} else {
				const found = state.parseVariable(`{{${id}}}`);

				if (typeof found !== "string") {
					val = JSON.stringify(found);
				} else {
					val = found;
				}
			}
			return (
				<>
					<div className="flex w-full gap-2 px-4 py-1 pl-12">
						<span className="font-medium text-sm">Name:</span>
						<span className="break-all text-muted-foreground text-sm">
							{id}
						</span>
					</div>
					<div className="flex w-full gap-2 px-4 py-1 pl-12">
						<span className="font-medium text-sm">Type:</span>
						<span className="break-all text-muted-foreground text-sm">
							{capitalizeFirstLetter(variable.type)}
						</span>
					</div>
					<div className="flex w-full gap-2 px-4 py-1 pl-12">
						<span className="font-medium text-sm">Value:</span>
						<span className="break-all text-muted-foreground text-sm">
							{val}
						</span>
					</div>
				</>
			);
		}, [variable, id]);

		return (
			<div className="flex h-auto max-h-[80vh] w-[424px] flex-col items-start rounded-xl bg-background shadow-lg">
				<div className="flex items-start gap-2.5 px-4 py-1">
					<div className="flex items-center gap-2 rounded-full px-2 py-1.5">
						<img
							src={PreviewButton}
							alt="Expand/Collapse"
							className="h-5 w-5"
						/>
						<span className="font-medium text-[#0471F0] text-sm">
							Preview
						</span>
					</div>
				</div>
				<Separator />
				<div className="flex max-h-[200px] w-full flex-col items-start gap-2 overflow-y-auto px-4 py-4 pl-12">
					{preview}
				</div>
				<Separator />
				<div className="flex max-h-[200px] w-full flex-col items-start overflow-y-auto">
					{previewValue}
				</div>
			</div>
		);
	},
);
