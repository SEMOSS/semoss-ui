import { useState } from "react";
import { Box, Stack, styled } from "@semoss/ui";
import { FileEditorTab } from "./FIleEditorTab";
import { FileExplorerTab } from "./FileExplorerTab";

interface FileManagerProps {
	appId: string;
	insightId: string;
	openOverlay: (component: () => JSX.Element) => void;
	closeOverlay: () => void;
	setLoading: (loading: boolean) => void;
}

const Container = styled(Stack)(({ theme }) => ({
	width: "100%",
	height: "100%",
	overflow: "hidden",
	flexDirection: "row",
	gap: theme.spacing(2),
	padding: theme.spacing(2),
	boxSizing: "border-box",
	alignItems: "flex-start",
}));

const LeftPanel = styled(Box)(({ theme }) => ({
	width: "300px",
	minWidth: "250px",
	maxWidth: "400px",
	height: "100%",
	overflow: "hidden",
	backgroundColor: theme.palette.background.paper,
	display: "flex",
	flexDirection: "column",
	borderRadius: "8px",
	border: `1px solid ${theme.palette.divider}`,
}));

const RightPanel = styled(Box)(({ theme }) => ({
	flex: 1,
	height: "100%",
	overflow: "hidden",
	backgroundColor: theme.palette.background.default,
	display: "flex",
	flexDirection: "column",
	borderRadius: "8px",
	border: `1px solid ${theme.palette.divider}`,
    marginTop:"0px",
}));

const EmptyState = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
	width: "100%",
	color: theme.palette.text.secondary,
	fontSize: "14px",
	fontFamily: "Inter",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const EmptyStateText = styled(Box)(({ theme }) => ({
	fontSize: "16px",
	fontWeight: 500,
	color: theme.palette.text.secondary,
}));

const EmptyStateSubtext = styled(Box)(({ theme }) => ({
	fontSize: "14px",
	color: theme.palette.text.disabled,
}));

export const FileManager = (props: FileManagerProps) => {
	const { appId, insightId, setLoading, openOverlay, closeOverlay } = props;

	const [selectedFilePath, setSelectedFilePath] = useState<string>("");

	return (
		<Container spacing={0}>
			<LeftPanel>
				<FileExplorerTab
					title="Project Files"
					appId={appId}
					insightId={insightId}
					setLoading={setLoading}
					openOverlay={openOverlay}
					closeOverlay={closeOverlay}
					onFileSelect={(path) => {
						if (path && path.slice(-1) !== "/") {
							setSelectedFilePath(path);
						} else {
							setSelectedFilePath("");
						}
					}}
				/>
			</LeftPanel>
			<RightPanel>
				{selectedFilePath ? (
					<FileEditorTab
						key={selectedFilePath}
						path={selectedFilePath}
						appId={appId}
						insightId={insightId}
					/>
				) : (
					<EmptyState>
						<EmptyStateText>No File Selected</EmptyStateText>
						<EmptyStateSubtext>
							Select a file from the explorer to start editing
						</EmptyStateSubtext>
					</EmptyState>
				)}
			</RightPanel>
		</Container>
	);
};
