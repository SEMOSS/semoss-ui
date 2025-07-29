import {
	AttachFileRounded,
	AudioFileOutlined,
	CloseRounded,
	InsertDriveFile,
	SendRounded,
	TextSnippetOutlined,
	VideoFileOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React, { useRef, useState } from "react";
import {
	Badge,
	CircularProgress,
	FormControl,
	IconButton,
	Stack,
	styled,
	TextField,
	Tooltip,
	useNotification,
} from "@semoss/ui";

const ENABLE_ATTACHMENT = import.meta.env.VITE_ENABLE_ATTACHMENT === "true";

const StyledContainer = styled(FormControl)(({ theme }) => ({
	position: "relative",
	width: "100%",
}));

const StyledInput = styled(TextField, {
	shouldForwardProp: (prop) => prop !== "dragging",
})<{
	/** Highlight if dragging */
	dragging: boolean;
}>(({ theme, dragging }) => ({
	"& .MuiInputBase-input::placeholder": {
		color: theme.palette.text.primary,
		opacity: 1,
	},
	"& .MuiOutlinedInput-root": {
		paddingBottom: "51px",
		"& fieldset": {
			borderColor: dragging ? theme.palette.primary.border : "",
			borderStyle: dragging ? "dashed" : "",
			borderRadius: theme.spacing(1),
		},
	},
}));

const StyledActions = styled(Stack)(({ theme }) => ({
	position: "absolute",
	bottom: "8.5px",
	left: "14px",
	right: "14px",
	zIndex: 1,

	// pointerEvents: 'none',
	// '& *': {
	//     pointerEvents: 'all',
	// },
}));

const StyledFileContainer = styled(Stack)(({ theme }) => ({
	width: "100%",
	marginTop: theme.spacing(2),
	overflowX: "auto",
	overflowY: "hidden",
}));

const StyledFile = styled(Stack)(({ theme }) => ({
	position: "relative",
	height: "80px",
	width: "80px",
	borderWidth: `1px`,
	borderStyle: "solid",
	borderColor: "rgba(0, 0, 0, 0.23)",
	borderRadius: "4px",
	overflow: "hidden",
	flexShrink: 0,
	"& img": {
		width: "100%",
	},

	'& [data-hover="true"]': {
		display: "none",
	},

	"&:hover": {
		'& [data-hover="true"]': {
			display: "block",
		},
	},
}));

const StyledFileClose = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	top: "0",
	right: "0",
}));

interface RoomInputProps {
	/** Track if it is loading */
	isLoading: boolean;

	/** Track if it is disabled */
	isDisabled: boolean;

	/** Minimum number of rendered rows rows */
	minRows: number;

	/** Maximum number of rendered rows rows */
	maxRows: number;

	/** Custom actions */
	actions: React.ReactNode;

	/** Callback triggered to process the prompt. Throw an error if necessary */
	onPrompt: (prompt: string, files: File[]) => Promise<boolean>;
}

export const RoomInput: React.FC<RoomInputProps> = observer(
	({
		isLoading,
		isDisabled,
		minRows = 2,
		maxRows = 6,
		actions = null,
		onPrompt = () => null,
	}) => {
		const notification = useNotification();

		const [input, setInput] = useState("");

		const fileRef = useRef(null);

		const [isDragging, setIsDragging] = useState(false);
		const [files, setFiles] = useState<File[]>([]);

		/**
		 * Prompt the model
		 *
		 * @param - input
		 */
		const promptModel = async (input: string) => {
			try {
				// ignore if loading
				if (isDisabled || isLoading) {
					return;
				}

				// ask the room
				const success = await onPrompt(input, files);
				if (success) {
					// clear the input
					setInput("");
				} else {
					throw new Error(`Error processing chat`);
				}
			} catch (e) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		/**
		 * Get an image for the file
		 */
		const getFileImage = (file: File): React.ReactNode => {
			if (file.type.startsWith("image/")) {
				const imageUrl = URL.createObjectURL(file);
				return (
					<img
						src={imageUrl}
						alt={file.name}
						onLoad={() => URL.revokeObjectURL(imageUrl)}
					/>
				);
			} else if (
				file.type.includes("text") ||
				file.type.includes("document")
			) {
				return (
					<TextSnippetOutlined fontSize={"large"} color="disabled" />
				);
			} else if (file.type.includes("audio")) {
				return (
					<AudioFileOutlined fontSize={"large"} color="disabled" />
				);
			} else if (file.type.includes("video")) {
				return (
					<VideoFileOutlined fontSize={"large"} color="disabled" />
				);
			}

			return <InsertDriveFile fontSize={"large"} color="disabled" />;
		};

		const isEmpty = input.trim().length === 0;

		console.log(isDragging, files);

		return (
			<>
				<StyledContainer>
					<input
						ref={fileRef}
						type="file"
						multiple={true}
						hidden
						onChange={(e) => {
							// set the new files
							const updated = Array.from(e.target.files);
							setFiles((prev) => [...prev, ...updated]);
						}}
					/>
					<StyledInput
						dragging={isDragging}
						placeholder="Ask a question"
						variant={"outlined"}
						value={input}
						fullWidth
						multiline
						size={"small"}
						minRows={minRows}
						maxRows={maxRows}
						disabled={isDisabled || isLoading}
						onChange={(e) => setInput(e.target.value)}
						onDrop={(e) => {
							e.preventDefault();

							// set the new files
							const updated = Array.from(e.dataTransfer.files);
							setFiles((prev) => [...prev, ...updated]);

							// turn off dragging
							setIsDragging(false);
						}}
						onDragOver={(e) => {
							e.preventDefault();

							// turn on dragging
							setIsDragging(true);
						}}
						onDragLeave={(e) => {
							e.preventDefault();

							// turn off dragging
							setIsDragging(false);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								promptModel(input);
							}
						}}
					></StyledInput>
					<StyledActions
						direction={"row"}
						alignItems={"center"}
						justifyContent={"flex-end"}
						spacing={0.5}
					>
						{actions}
						{ENABLE_ATTACHMENT && (
							<Tooltip title={"Attach Document"} placement="top">
								<IconButton
									size={"small"}
									type="button"
									color="default"
									aria-label="Attach Documents"
									disabled={isDisabled || isLoading}
									onClick={() => {
										fileRef.current?.click();
									}}
								>
									<Badge
										color={"primary"}
										variant="dot"
										invisible={files.length === 0}
									>
										<AttachFileRounded
											color={"inherit"}
											fontSize="medium"
										/>
									</Badge>
								</IconButton>
							</Tooltip>
						)}
						<Tooltip
							title={(() => {
								if (isEmpty) {
									return "Please enter a prompt";
								} else if (isLoading) {
									return "Processing prompt";
								} else if (isDisabled) {
									return "";
								}
								return "Prompt";
							})()}
							placement="top"
						>
							<span>
								<IconButton
									size={"small"}
									type="button"
									color="primary"
									aria-label="Prompt the Model"
									disabled={
										isDisabled || isLoading || isEmpty
									}
									onClick={() => {
										promptModel(input);
									}}
								>
									{isLoading ? (
										<CircularProgress
											size={"24px"}
											color="primary"
										/>
									) : (
										<SendRounded
											color={"inherit"}
											fontSize="medium"
										/>
									)}
								</IconButton>
							</span>
						</Tooltip>
					</StyledActions>
				</StyledContainer>
				{files.length > 0 ? (
					<StyledFileContainer
						direction="row"
						alignItems={"center"}
						spacing={1}
					>
						{files.map((f, fIdx) => {
							return (
								<Tooltip
									key={fIdx}
									title={f.name}
									placement="bottom"
								>
									<span>
										<StyledFile
											direction="row"
											alignItems={"center"}
											justifyContent={"center"}
										>
											{getFileImage(f)}
											<StyledFileClose
												size="small"
												data-hover={true}
												onClick={() => {
													const updated = [...files];

													// remove it
													updated.splice(fIdx, 1);

													setFiles(updated);
												}}
											>
												<CloseRounded fontSize="small" />
											</StyledFileClose>
										</StyledFile>
									</span>
								</Tooltip>
							);
						})}
					</StyledFileContainer>
				) : null}
			</>
		);
	},
);
