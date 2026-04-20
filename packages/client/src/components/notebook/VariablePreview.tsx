import { JsonViewer } from "@textea/json-viewer";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Renderer,
	type SerializedState,
	useBlocks,
	type Variable,
} from "@semoss/renderer";
import { capitalizeFirstLetter, isOutputJSON } from "@/utility";
import PreviewButton from "../../assets/img/PreviewRounded.png";

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
						<div style={{ width: "350px" }}>
							<Renderer state={config} preview={true} />
						</div>
					);
				} else {
					return (
						<p className="text-sm font-bold text-destructive">
							Block is no longer available
						</p>
					);
				}
			} else {
				const found = state.parseVariable(`{{${id}}}`);
				const value = isOutputJSON(found);
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
						<span
							style={{
								color: "#666",
								fontFamily: "Inter",
								fontSize: "14px",
								fontWeight: 400,
								lineHeight: "150%",
								letterSpacing: "0.17px",
							}}
						>
							{found as string}
						</span>
					);
				}
			}
		}, [variable, id]);

		const previewValue = useMemo(() => {
			let val;

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
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "flex-start",
							gap: "8px",
							alignSelf: "stretch",
							padding: "4px 16px 4px 48px",
							borderRadius: "4px",
							width: "100%",
						}}
					>
						<span
							style={{
								color: "#212121",
								fontFamily: "Inter",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								letterSpacing: "0.15px",
							}}
						>
							Name:
						</span>
						<span
							style={{
								color: "#666",
								fontFamily: "Inter",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								letterSpacing: "0.15px",
								whiteSpace: "normal",
								wordBreak: "break-all",
								overflowWrap: "anywhere",
								width: "100%",
								display: "block",
							}}
						>
							{id}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "flex-start",
							gap: "8px",
							alignSelf: "stretch",
							padding: "4px 16px 4px 48px",
							borderRadius: "4px",
							width: "100%",
						}}
					>
						<span
							style={{
								color: "#212121",
								fontFamily: "Inter",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								letterSpacing: "0.15px",
							}}
						>
							Type:
						</span>
						<span
							style={{
								color: "#666",
								fontFamily: "Inter",
								fontSize: "16px",
								fontWeight: 400,
								lineHeight: "24px",
								letterSpacing: "0.15px",
								whiteSpace: "normal",
								wordBreak: "break-all",
								overflowWrap: "anywhere",
								width: "100%",
								display: "block",
							}}
						>
							{capitalizeFirstLetter(variable.type)}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "flex-start",
							gap: "8px",
							alignSelf: "stretch",
							padding: "4px 16px 4px 48px",
							borderRadius: "4px",
							width: "100%",
						}}
					>
						<span
							style={{
								color: "#212121",
								fontFamily: "Inter",
								fontSize: "14px",
								fontWeight: 400,
								lineHeight: "24px",
								letterSpacing: "0.17px",
							}}
						>
							Value:
						</span>
						<span
							style={{
								color: "#666",
								fontFamily: "Inter",
								fontSize: "14px",
								fontWeight: 400,
								lineHeight: "24px",
								letterSpacing: "0.17px",
								whiteSpace: "normal",
								wordBreak: "break-all",
								overflowWrap: "anywhere",
								width: "100%",
								display: "block",
							}}
						>
							{val}
						</span>
					</div>
				</>
			);
		}, [variable, id]);

		return (
			<div
				style={{
					height: "auto",
					width: "424px",
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					borderRadius: "12px",
					background: "#FFF",
					boxShadow: "0 5px 16px 0 rgba(0, 0, 0, 0.16)",
					maxHeight: "calc(80vh)",
					boxSizing: "border-box",
				}}
			>
				<div
					style={{
						height: "auto",
						display: "flex",
						padding: "4px 16px",
						flexDirection: "row",
						alignItems: "flex-start",
						gap: "10px",
						alignSelf: "stretch",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "flex-start",
							gap: "8px",
							padding: "6px 8px",
							borderRadius: "16px",
						}}
					>
						<div className="flex items-center gap-2">
							<img
								src={PreviewButton}
								alt="Expand/Collapse"
								style={{
									display: "flex",
									height: "20px",
									width: 20,
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
								}}
							/>
							<span
								style={{
									color: "#0471F0",
									fontFamily: "Inter",
									fontSize: "14px",
									fontWeight: 500,
									lineHeight: "24px",
									letterSpacing: "0.4px",
								}}
							>
								Preview
							</span>
						</div>
					</div>
				</div>
				<hr style={{ width: "100%", border: "1px solid #E6E6E6" }} />
				<div
					style={{
						width: "100%",
						display: "flex",
						padding: "16px 16px 16px 48px",
						flexDirection: "column",
						alignItems: "flex-start",
						gap: "8px",
						borderRadius: "4px",
						maxHeight: "200px",
						overflowY: "auto",
					}}
				>
					{preview}
				</div>
				<hr style={{ width: "100%", border: "1px solid #E6E6E6" }} />
				<div
					style={{
						display: "flex",
						padding: "8px 0",
						flexDirection: "column",
						alignItems: "flex-start",
						alignSelf: "stretch",
						width: "100%",
						maxHeight: "200px",
						overflowY: "auto",
						height: "auto",
					}}
				>
					{previewValue}
				</div>
			</div>
		);
	},
);
