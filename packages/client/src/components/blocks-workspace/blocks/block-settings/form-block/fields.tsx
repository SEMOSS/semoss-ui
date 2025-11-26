import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	type Paths,
	useBlocks,
} from "@semoss/renderer";
import { Accordion, Box, Menu, Select, styled, Typography } from "@semoss/ui";

const StyledAccordionTrigger = styled(Accordion.Trigger)(({ theme }) => ({
	"& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
		transform: "rotate(180deg)",
	},
	"&.Mui-expanded": {
		backgroundColor: theme.palette.primary.selected,
	},
	transition: "background-color 0.2s ease",
}));

const StyledSpan = styled("span")(() => ({
	fontSize: "14px",
	fontStyle: "normal",
	lineHeight: "143%",
	letterSpacing: "0.17px",
	fontFamily: '"Inter", sans-serif',
	textTransform: "uppercase",
	fontWeight: 400,
}));

const StyledBox = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: "700px",
	margin: "auto",
}));

const MainAccordion = styled(Accordion)(({ theme }) => ({
	marginBottom: theme.spacing(1),
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
	marginBottom: theme.spacing(1),
	boxShadow: "none",
	border: "none",
}));

const InnerBox = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	gap: 1,
}));

interface SelectInputSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const FieldSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
	}: SelectInputSettingsProps<D>) => {
		const { state } = useBlocks();
		const [expandedId, setExpandedId] = useState<string | null>(null);

		const block = useMemo(() => state.getBlock(id), [state, id]);
		const childrenIds: string[] = block?.slots?.children?.children ?? [];

		if (!block) {
			return (
				<Typography variant={"h6"} fontWeight="regular">
					No block found for ID
				</Typography>
			);
		}

		const parseBoolean = (val: string) =>
			/^(true|1|yes)$/i.test(val.trim());

		const handleTextToggle = (
			childId: string,
			key: "required" | "disabled",
			nextValue: string,
		) => {
			const child = state.getBlock(childId);
			if (!child) {
				console.warn(`Child block not found: ${childId}`);
				return;
			}

			const next = parseBoolean(nextValue);

			if (!child.data || typeof child.data !== "object") {
				child.data = {};
			}

			try {
				child.data[key] = next;
			} catch {
				child.data = { ...(child.data || {}), [key]: next };
			}
		};

		return (
			<StyledBox>
				{childrenIds.length === 0 ? (
					<Typography
						color="textSecondary"
						variant={"h6"}
						fontWeight="regular"
					>
						No children found
					</Typography>
				) : (
					childrenIds.map((childId) => {
						const child = state.getBlock(childId);
						const childData = (child && child.data) || {};
						const requiredStr = String(!!childData.required);
						const disabledStr = String(!!childData.disabled);

						if (!child) {
							return (
								<MainAccordion key={childId}>
									<Accordion.Content
										aria-controls={`${childId}-content`}
										key={`${childId}-header`}
									>
										<Typography
											fontWeight="bold"
											variant={"button"}
										>
											{childId}
										</Typography>
									</Accordion.Content>
								</MainAccordion>
							);
						}

						const isExpanded = expandedId === childId;

						return (
							<StyledAccordion
								expanded={isExpanded}
								onChange={() =>
									setExpandedId((prev) =>
										prev === childId ? null : childId,
									)
								}
								key={childId}
							>
								<StyledAccordionTrigger
									expandIcon={<ExpandMoreIcon />}
								>
									<StyledSpan>{childId}</StyledSpan>
								</StyledAccordionTrigger>

								<Accordion.Content>
									<InnerBox>
										<Typography
											variant="body2"
											fontWeight="regular"
											color="textSecondary"
										>
											Required
										</Typography>
										<Select
											fullWidth
											size="small"
											value={requiredStr}
											onChange={(e) => {
												handleTextToggle(
													childId,
													"required",
													e.target.value,
												);
											}}
										>
											<Menu.Item value={"true"}>
												True
											</Menu.Item>
											<Menu.Item value={"false"}>
												False
											</Menu.Item>
										</Select>

										<Typography
											variant="body2"
											fontWeight="regular"
											color="textSecondary"
										>
											Disabled
										</Typography>
										<Select
											fullWidth
											size="small"
											value={disabledStr}
											onChange={(e) => {
												handleTextToggle(
													childId,
													"disabled",
													e.target.value,
												);
											}}
										>
											<Menu.Item value={"true"}>
												True
											</Menu.Item>
											<Menu.Item value={"false"}>
												False
											</Menu.Item>
										</Select>
									</InnerBox>
								</Accordion.Content>
							</StyledAccordion>
						);
					})
				)}
			</StyledBox>
		);
	},
);
