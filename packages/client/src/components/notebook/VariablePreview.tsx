import { JsonViewer } from "@textea/json-viewer";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Renderer,
	type SerializedState,
	useBlocks,
	type Variable,
} from "@semoss/renderer";
import { Box, Divider, Stack, styled, Typography } from "@semoss/ui";
import { capitalizeFirstLetter, isOutputJSON } from "@/utility";
import PreviewButton from "../../assets/img/PreviewRounded.png";

const StyledStack = styled(Stack)(({ theme }) => ({
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
}));

const StyledBox = styled(Box)(({ theme }) => ({
	height: "auto",
	display: "flex",
	padding: "4px 16px",
	flexDirection: "row",
	alignItems: "flex-start",
	gap: "10px",
	alignSelf: "stretch",
}));

const StyledPreviewBox = styled(Box)(({ theme }) => ({
	width: "100%",
	display: "flex",
	padding: "16px 16px 16px 48px",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "8px",
	borderRadius: "var(--Shape-borderRadiusSm, 4px)",
	maxHeight: "200px",
	overflowY: "auto",
}));

const StyledBlocksBox = styled(Box)(({ theme }) => ({
	width: "350px",
	"& .MuiFormLabel-root.MuiInputLabel-root": {
		top: "6px",
	},
}));
const StyledPreviewStack = styled(Stack)(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	alignItems: "flex-start",
	gap: "8px",
	padding: "6px 8px",
	borderRadius: "16px",
}));

const StyledDiv = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: "8px",
}));
const StyledImg = styled("img")(({ theme }) => ({
	display: "flex",
	height: "20px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: "#0471F0",
	fontFamily: "Inter",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: "500",
	lineHeight: "24px",
	letterSpacing: "0.4px",
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
	width: "100%",
	height: "1px",
	border: "1px solid var(--Secondary-Divider, #E6E6E6)",
}));

const StyledPreviewTypography = styled(Typography)(({ theme }) => ({
	color: "#666",
	fontFamily: "Inter",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: "400",
	lineHeight: "150%",
	letterSpacing: "0.17px",
}));

const StyledContentBox = styled(Box)(({ theme }) => ({
	display: "flex",
	padding: "8px 0",
	flexDirection: "column",
	alignItems: "flex-start",
	alignSelf: "stretch",
	width: "100%",
	maxHeight: "200px",
	overflowY: "auto",
	height: "auto",
}));

const StyledContentStack = styled(Typography)(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	alignItems: "flex-start",
	gap: "8px",
	alignSelf: "stretch",
	padding: "4px 16px 4px 48px",
	borderRadius: "var(--Shape-borderRadiusSm, 4px)",
	width: "100%",
}));

const StyledTextTypography = styled(Typography)(({ theme }) => ({
	color: "#212121",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: "400",
	lineHeight: "24px",
	letterSpacing: "0.15px",
}));
const StyledValueTextTypography = styled(Typography)(({ theme }) => ({
	color: "#212121",
	fontFamily: "Inter",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: "400",
	lineHeight: "24px",
	letterSpacing: "0.17px",
}));

const StyledContentTypography = styled(Typography)(({ theme }) => ({
	color: "#666",
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: "400",
	lineHeight: "24px",
	letterSpacing: "0.15px",
	whiteSpace: "normal",
	wordBreak: "break-all",
	overflowWrap: "anywhere",
	width: "100%",
	display: "block",
}));

const StyledValueContentTypography = styled(Typography)(({ theme }) => ({
	color: "#666",
	fontFamily: "Inter",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: "400",
	lineHeight: "24px",
	letterSpacing: "0.17px",
	whiteSpace: "normal",
	wordBreak: "break-all",
	overflowWrap: "anywhere",
	width: "100%",
	display: "block",
}));

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
						<StyledBlocksBox>
							<Renderer state={config} preview={true} />
						</StyledBlocksBox>
					);
				} else {
					return (
						<Typography
							variant="body2"
							fontWeight="bold"
							color="error"
						>
							Block is no longer available
						</Typography>
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
						<StyledPreviewTypography variant="body2">
							{found as string}
						</StyledPreviewTypography>
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
					<StyledContentStack variant="body1">
						<StyledTextTypography variant="body2">
							Name:
						</StyledTextTypography>
						<StyledContentTypography variant="body2">
							{id}
						</StyledContentTypography>
					</StyledContentStack>
					<StyledContentStack variant="body1">
						<StyledTextTypography variant="body2">
							Type:
						</StyledTextTypography>
						<StyledContentTypography variant="body2">
							{capitalizeFirstLetter(variable.type)}
						</StyledContentTypography>
					</StyledContentStack>
					<StyledContentStack variant="body1">
						<StyledValueTextTypography variant="body2">
							Value:
						</StyledValueTextTypography>
						<StyledValueContentTypography variant="body2">
							{val}
						</StyledValueContentTypography>
					</StyledContentStack>
				</>
			);
		}, [variable, id]);

		return (
			<StyledStack spacing={0}>
				<StyledBox>
					<StyledPreviewStack>
						<StyledDiv>
							<StyledImg
								src={PreviewButton}
								alt="Expand/Collapse"
								style={{
									width: 20,
								}}
							/>
							<StyledTypography
								variant={"body2"}
								fontWeight="medium"
							>
								Preview
							</StyledTypography>
						</StyledDiv>
					</StyledPreviewStack>
				</StyledBox>
				<StyledDivider />
				<StyledPreviewBox>{preview}</StyledPreviewBox>
				<StyledDivider />
				<StyledContentBox>{previewValue}</StyledContentBox>
			</StyledStack>
		);
	},
);
