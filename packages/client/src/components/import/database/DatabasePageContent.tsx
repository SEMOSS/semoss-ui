import { FileUploadOutlined } from "@mui/icons-material";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Breadcrumbs,
	Button,
	FileDropzone,
	Grid,
	Link,
	LoadingScreen,
	Modal,
	Search,
	Stack,
	styled,
	Tabs,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { DatabaseForm } from "./DatabaseForm";
import {
	CATEGORY_DESCRIPTIONS,
	DATABASE_CONNECTION,
} from "./database.constants";

const StyledContainer = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	width: "auto",
});

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	gap: theme.spacing(2),
}));

const StyledStack = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledCardImage = styled("img")<{ isDatabase?: boolean }>(
	({ isDatabase }) => ({
		display: "flex",
		height: "30px",
		width: "30px",
		objectFit: "cover",
		borderRadius: isDatabase ? "8px" : "inherit",
	}),
);

const StyledCardText = styled("p")({
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	margin: 0,
});

const StyledTypographyText = styled(Typography)(() => ({
	display: "flex",
	alignItems: "center",
	padding: "0 10px",
	backgroundColor: "#EBEBEB",
	borderRadius: "16px",
	marginLeft: "auto !important",
	fontSize: "13px",
	color: "#212121",
}));

const StyledFormTypeBox = styled(Box, {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled: boolean }>(({ disabled }) => ({
	maxWidth: "215px",
	borderRadius: "8px",
	display: "block",
	justifyContent: "center",
	alignItems: "center",
	border: "1px solid #C4C4C4",
	padding: "16px",
	backgroundColor: "#fff",
	opacity: disabled ? 0.6 : 1,
	cursor: disabled ? "auto" : "pointer",
	"&:hover": {
		border: disabled ? "1px solid #C4C4C4" : "1.5px solid #0471F0",
		backgroundColor: disabled ? "white" : "#F5F9FE",
	},
}));

const StyledTab = styled(Tabs.Item)(() => ({
	fontSize: "14px",
	fontWeight: 500,
	letterSpacing: "0.4px",
	color: "rgba(0, 0, 0, 0.60)",
}));

const UploadButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.text.primary,
	borderRadius: "12px",
	alignSelf: "flex-start",
}));

const StyledDropzoneField = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	width: "100%",
	height: "100%",
}));

const SubmitUploadButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.background.default,
	borderRadius: "12px",
	alignSelf: "flex-start",
}));

const CloseButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.secondary.dark,
	borderRadius: "12px",
	alignSelf: "flex-start",
}));

interface database {
	fields: [];
	advanced: [];
	id: number;
	name: string;
	icon: string;
	disable: boolean;
}

const DatabaseCard = ({
	database,
	onSelect,
}: {
	database: database;
	onSelect: () => void;
}) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		if (textRef.current) {
			setIsTruncated(
				textRef.current.scrollWidth > textRef.current.clientWidth,
			);
		}
	}, []);

	const cardContent = (
		<StyledFormTypeBox
			data-testid={`database-card-${database.id}`}
			disabled={database.disable}
			onClick={!database.disable ? onSelect : undefined}
		>
			{database.disable ? (
				<Stack direction="row" width="100%" spacing={1}>
					<StyledCardImage isDatabase src={database.icon} />
					<StyledTypographyText variant="body1">
						Coming Soon
					</StyledTypographyText>
				</Stack>
			) : (
				<StyledCardImage isDatabase src={database.icon} />
			)}
			<StyledCardText
				ref={textRef}
				data-testid={`database-name-${database.id}`}
			>
				{database.name}
			</StyledCardText>
		</StyledFormTypeBox>
	);

	return isTruncated ? (
		<Tooltip title={database.name} placement="bottom" arrow>
			<span style={{ display: "block" }}>{cardContent}</span>
		</Tooltip>
	) : (
		cardContent
	);
};

export const DatabasePageContent: React.FC<{ name: string }> = ({ name }) => {
	const navigate = useNavigate();
	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTab, setSelectedTab] = useState(0);
	const [selectedDatabase, setSelectedDatabase] = useState<database | null>(
		null,
	);

	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [filedata, setFiledata] = useState(null);

	const DatabaseOptions = DATABASE_CONNECTION;
	const CategoryDescription = CATEGORY_DESCRIPTIONS;

	const pageTitle = "Connect to database";
	const pageDescription =
		"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications.";

	const tabLabels = useMemo(() => ["Connections", "File Uploads"], []);
	const allDatabases = useMemo(() => {
		return [
			...(DatabaseOptions.Connections || []),
			...(DatabaseOptions["File Uploads"] || []),
		];
	}, [DatabaseOptions]);

	const DatabasesForTab = useMemo(() => {
		return DatabaseOptions[tabLabels[selectedTab]] || [];
	}, [selectedTab, tabLabels, DatabaseOptions, allDatabases]);

	if (loading) {
		return <LoadingScreen.Trigger description="Loading..." />;
	}

	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const uploadedFiles = await uploadFile(
				[data],
				configStore.store.insightID,
			);

			if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
				notification.add({
					color: "error",
					message: "Upload failed or returned invalid response.",
				});
				setFiledata(null);
				return;
			}
			const pixelExpressions = uploadedFiles.map(
				(file) =>
					`UploadDatabase(filePath=["${file.fileLocation}"],space=[""])`,
			);
			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					notification.add({ color: "error", message: output });
					setFiledata(null);
					return;
				}
				notification.add({
					color: "success",
					message: "Successfully Created Database",
				});
				navigate(`/engine/database/${output.database_id}`);
			}
		} catch {
			notification.add({
				color: "error",
				message: "Upload failed or returned invalid response.",
			});
			setFiledata(null);
		} finally {
			setLoading(false);
		}
	};

	const renderBreadcrumbs = () => (
		<Breadcrumbs separator="/" data-testid="breadcrumbs">
			<Breadcrumbs.Item
				// @ts-expect-error TODO FIX
				as={Link}
				underline="none"
				color="inherit"
				variant="body1"
				onClick={() =>
					window.history.length > 1 ? navigate(-1) : navigate("/")
				}
				data-testid="breadcrumb-catalog"
			>
				{name} Catalog
			</Breadcrumbs.Item>

			<Breadcrumbs.Item
				// @ts-expect-error TODO FIX
				as={Link}
				underline="none"
				color={selectedDatabase ? "inherit" : "text.disabled"}
				variant="body1"
				onClick={() => {
					if (selectedDatabase) {
						setSelectedDatabase(null);
					}
				}}
				sx={{ cursor: selectedDatabase ? "pointer" : "default" }}
				data-testid="breadcrumb-page"
			>
				Connect to Database
			</Breadcrumbs.Item>

			{selectedDatabase && (
				<Breadcrumbs.Item
					// @ts-expect-error TODO FIX
					as={Link}
					underline="none"
					color="text.disabled"
					variant="body1"
					data-testid="breadcrumb-selected-database"
				>
					{selectedDatabase.name}
				</Breadcrumbs.Item>
			)}
		</Breadcrumbs>
	);

	const renderDatabaseGrid = (Databases: database[]) => (
		<Grid
			container
			columns={6}
			columnSpacing={2}
			rowSpacing={2}
			data-testid="database-grid"
		>
			{Databases.filter((v) =>
				v.name.toLowerCase().includes(search.toLowerCase()),
			).map((v) => (
				<Grid key={v.id} item lg={1} md={1} xs={1} xl={1} sm={1}>
					<DatabaseCard
						database={v}
						onSelect={() => setSelectedDatabase(v)}
					/>
				</Grid>
			))}
		</Grid>
	);

	const handleFileUpload = (flag: boolean) => {
		// Open or close the file upload modal based on the provided flag
		setIsFileUploadModalOpen(flag);
	};

	return (
		<>
			{renderBreadcrumbs()}
			<Modal
				open={isFileUploadModalOpen}
				maxWidth="xl"
				onClose={() => setIsFileUploadModalOpen(false)}
				data-testid="database-zip-upload-modal"
			>
				<Modal.Content sx={{ width: "600px" }}>
					<StyledDropzoneField>
						<Typography
							variant={"body1"}
							data-testid="database-zip-upload-title"
						>
							Zip File
						</Typography>
						<FileDropzone
							multiple={false}
							onChange={(newValues) => {
								setFiledata(newValues);
							}}
						/>
						<Stack
							spacing={2}
							direction="row"
							justifyContent="flex-end"
						>
							<CloseButton
								size="small"
								variant="text"
								onClick={() => setIsFileUploadModalOpen(false)}
								data-testid="database-upload-close-button"
							>
								Close
							</CloseButton>
							<SubmitUploadButton
								size="small"
								variant="contained"
								disabled={!filedata}
								onClick={() => onSubmit(filedata)}
								data-testid="database-upload-submit-button"
							>
								Upload
							</SubmitUploadButton>
						</Stack>
					</StyledDropzoneField>
				</Modal.Content>
			</Modal>
			{selectedDatabase ? (
				<div data-testid="database-form-wrapper">
					<DatabaseForm
						selectedTab={tabLabels[selectedTab]}
						title={selectedDatabase.name}
						description={`Fill out ${selectedDatabase.name} details in order to add database to catalog`}
						fields={selectedDatabase.fields}
						advanced={selectedDatabase.advanced}
						categoryDescription={CategoryDescription}
					/>
				</div>
			) : (
				<Stack direction="column" gap={2} data-testid="database-page">
					<StyledStack>
						<Typography
							variant="h4"
							sx={{ fontWeight: 500 }}
							data-testid="page-title"
						>
							{pageTitle}
						</Typography>
						<Typography
							variant="body1"
							color="textSecondary"
							data-testid="page-description"
						>
							{pageDescription}
						</Typography>
					</StyledStack>

					<StyledContainer>
						<StyledSearchbarContainer>
							<Search
								size="small"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								fullWidth
								data-testid="search-box"
							/>
							<UploadButton
								sx={{ lineHeight: 0.75 }}
								size="large"
								variant="outlined"
								onClick={() => handleFileUpload(true)}
								data-testid={"database-upload-file-button"}
							>
								<FileUploadOutlined fontSize="medium" />
							</UploadButton>
						</StyledSearchbarContainer>

						<Box sx={{ width: "100%" }}>
							<Tabs
								value={selectedTab}
								onChange={(_, newValue) =>
									setSelectedTab(newValue)
								}
								variant="scrollable"
								sx={{
									mt: 2,
									borderBottom: "2px solid #E0E0E0",
								}}
								data-testid="tabs"
							>
								{tabLabels.map((label) => (
									<StyledTab
										key={label}
										label={label}
										data-testid={`tab-${label.toLowerCase()}`}
									/>
								))}
							</Tabs>
							<Box sx={{ mt: 4 }}>
								{renderDatabaseGrid(DatabasesForTab)}
							</Box>
						</Box>
					</StyledContainer>
				</Stack>
			)}
		</>
	);
};
