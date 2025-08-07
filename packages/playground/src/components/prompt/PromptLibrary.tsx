import { Close } from "@mui/icons-material";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Chip,
	CircularProgress,
	Grid,
	IconButton,
	Menu,
	Modal,
	Search,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useDebounceValue } from "@/hooks";
import type { Prompt } from "@/types";

const StyledHolder = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "422px",
	maxHeight: "40vh",
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
	overflow: "auto",
}));

const StyledItem = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	padding: theme.spacing(1),
	width: "100%",
	height: "130px",
	backgroundColor: theme.palette.background.default,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "transparent",
	borderRadius: theme.shape.borderRadius,
	cursor: "pointer",
}));

const StyledItemDescription = styled(Typography)(({ theme }) => ({
	display: "-webkit-box",
	height: "60px",
	overflow: "hidden",
	WebkitBoxOrient: "vertical",
	WebkitLineClamp: 3,
}));

interface PromptLibraryProps {
	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean, prompt?: Prompt) => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onClose }) => {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<string>("");

	// debounce the input
	const debouncedSearch = useDebounceValue(search);

	const getAllTags = usePixel<
		{
			METAKEY: "tag";
			METAVALUE: string;
			count: number;
		}[]
	>(`GetPromptMetaValues ( metaKeys = [ "tag" ] ) ;`, {
		data: [],
	});

	const getPrompts = usePixel<Prompt[]>(
		`ListPrompt(${
			debouncedSearch
				? `filters=[Filter(PROMPT__TITLE==["${debouncedSearch}"])] ,`
				: ""
		} ${filter ? `metaFilters=[Filter(TAG==["${filter}"])] ,` : ""});`,
		{
			data: [],
		},
	);

	return (
		<Modal
			open={true}
			onClose={() => onClose(false)}
			aria-labelledby="select tool"
			aria-describedby="select tool"
			maxWidth={"md"}
			fullWidth={true}
			scroll="paper"
		>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">Select Prompt</Typography>
					<IconButton size="small" onClick={() => onClose(false)}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Stack direction={"column"} spacing={2} py={1}>
					<Stack direction={"row"} width={"100%"} spacing={2}>
						<Search
							label="Search"
							size="small"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
							}}
							fullWidth={true}
							sx={{
								flex: 1,
							}}
						/>

						<TextField
							label={"Filter"}
							color="primary"
							variant={"outlined"}
							size="small"
							select
							value={filter}
							sx={{
								width: "194px",
							}}
							onChange={(e) => setFilter(e.target.value)}
						>
							<Menu.Item value={""}>All</Menu.Item>
							{getAllTags.data.map((t, tIdx) => (
								<Menu.Item key={tIdx} value={t.METAVALUE}>
									{t.METAVALUE}
								</Menu.Item>
							))}
						</TextField>
					</Stack>
					<StyledHolder>
						{getPrompts.status === "LOADING" && (
							<CircularProgress color="primary" />
						)}
						{getPrompts.status !== "LOADING" && (
							<Grid
								container
								spacing={2}
								// alignItems={'center'}
								// justifyItems={'center'}
								// overflow={'auto'}
								height={"100%"}
							>
								{getPrompts.data.map((p) => {
									return (
										<Grid key={p.ID} item xs={6}>
											<StyledItem
												onClick={() => {
													onClose(true, p);
												}}
											>
												<Stack
													direction={"row"}
													spacing={1}
												>
													<Stack
														direction={"column"}
														flex={1}
														spacing={0.25}
													>
														<Typography variant="subtitle2">
															{p.TITLE}
														</Typography>

														<Stack
															direction={"row"}
															spacing={1}
															flexWrap={"wrap"}
														>
															{p.tags.map(
																(t, tIdx) => (
																	<Chip
																		key={
																			tIdx
																		}
																		color="default"
																		size="small"
																		label={
																			t
																		}
																	/>
																),
															)}
														</Stack>
													</Stack>
												</Stack>
												<StyledItemDescription variant="caption">
													{p.INTENT}
												</StyledItemDescription>
											</StyledItem>
										</Grid>
									);
								})}
							</Grid>
						)}
					</StyledHolder>
				</Stack>
			</Modal.Content>
		</Modal>
	);
};
