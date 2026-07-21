import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import type { BrowserTabInfo } from "../types/browserEvents";

interface BrowserTabStripProps {
	tabs: BrowserTabInfo[];
	activeTabId: string;
	isRecording: boolean;
	onSwitch: (tabId: string) => void;
	onClose: (tabId: string) => void;
}

export function BrowserTabStrip({
	tabs,
	activeTabId,
	isRecording,
	onSwitch,
	onClose,
}: BrowserTabStripProps) {
	if (tabs.length === 0) return null;

	return (
		<Box
			sx={{
				order: -1,
				display: "flex",
				alignItems: "flex-end",
				gap: 0.25,
				px: 0.5,
				pt: 0.5,
				overflowX: "auto",
				bgcolor: "action.hover",
				borderBottom: "1px solid",
				borderColor: "divider",
			}}
		>
			{tabs.map((tab) => {
				const active = tab.tabId === activeTabId;
				const label = tab.title.trim() || tab.url || tab.tabId;
				return (
					<Box
						key={tab.tabId}
						sx={{
							display: "flex",
							alignItems: "center",
							flexShrink: 0,
							width: 210,
							maxWidth: "min(210px, 80vw)",
							borderRadius: "8px 8px 0 0",
							bgcolor: active
								? "background.paper"
								: "transparent",
							border: "1px solid",
							borderColor: active ? "divider" : "transparent",
							borderBottomColor: active
								? "background.paper"
								: "transparent",
							mb: "-1px",
						}}
					>
						<Tooltip title={tab.url || label}>
							<Button
								size="small"
								variant="text"
								onClick={() => onSwitch(tab.tabId)}
								sx={{
									minWidth: 0,
									flex: 1,
									px: 1,
									py: 0.5,
									color: "text.primary",
									textTransform: "none",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{label}
							</Button>
						</Tooltip>
						{tabs.length > 1 && (
							<Tooltip
								title={
									isRecording
										? "Stop recording before closing tabs"
										: "Close tab"
								}
							>
								<span>
									<IconButton
										size="small"
										aria-label={`Close ${label}`}
										disabled={isRecording}
										onClick={() => onClose(tab.tabId)}
										sx={{ mr: 0.5, p: 0.25, flexShrink: 0 }}
									>
										<CloseIcon sx={{ fontSize: 15 }} />
									</IconButton>
								</span>
							</Tooltip>
						)}
					</Box>
				);
			})}
		</Box>
	);
}
