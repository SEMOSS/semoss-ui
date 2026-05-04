/**
 * RecordingPanel Component
 * Displays recording controls and action history in the side panel
 */

import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX transform
import React, { useState } from "react";
import { Box, Button, Card, Stack, TextField, Typography } from "@semoss/ui";
import type { RecordedAction } from "../../recorder/types";
import { useRecordingState } from "../../services/recordingStateManager";

export const RecordingPanel: FC = () => {
	const {
		state,
		isLoading,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
		clearRecording,
	} = useRecordingState();
	const [scriptName, setScriptName] = useState("");

	const handleStartRecording = async () => {
		try {
			await startRecording();
		} catch (error) {
			console.error("[RecordingPanel] Failed to start recording:", error);
			alert(
				`Failed to start recording: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	const handleStopRecording = async () => {
		try {
			await stopRecording();
		} catch (error) {
			console.error("[RecordingPanel] Failed to stop recording:", error);
		}
	};

	const handlePause = async () => {
		try {
			if (state.isPaused) {
				await resumeRecording();
			} else {
				await pauseRecording();
			}
		} catch (error) {
			console.error("[RecordingPanel] Failed to pause/resume:", error);
		}
	};

	const handleSave = async () => {
		try {
			// Save to Chrome storage with the current name
			const { PlaywrightExporter } = await import(
				"../../recorder/exporters/PlaywrightExporter"
			);
			const name =
				scriptName.trim() ||
				`Recording_${new Date().toISOString().replace(/[:.]/g, "-")}`;
			const playwrightJson = PlaywrightExporter.create(
				state.actionsList,
				name,
			);

			// Save to local storage
			await chrome.storage.local.set({
				[`savedScript_${Date.now()}`]: {
					name,
					script: playwrightJson,
					savedAt: Date.now(),
				},
			});

			alert("Script saved successfully!");
		} catch (error) {
			console.error("[RecordingPanel] Failed to save:", error);
			alert(
				`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	const handleDownload = async () => {
		try {
			const { PlaywrightExporter } = await import(
				"../../recorder/exporters/PlaywrightExporter"
			);
			const name =
				scriptName.trim() ||
				`Recording_${new Date().toISOString().replace(/[:.]/g, "-")}`;
			const playwrightJson = PlaywrightExporter.create(
				state.actionsList,
				name,
			);

			// Custom replacer to ensure deviceScaleFactor is always formatted as float (1.0)
			const replacer = (key: string, value: unknown) => {
				if (key === "deviceScaleFactor" && typeof value === "number") {
					// Force float format by converting to string with .toFixed(1)
					return parseFloat(value.toFixed(1));
				}
				return value;
			};

			// Create blob and download with custom JSON formatting
			const jsonString = JSON.stringify(playwrightJson, replacer, 2);
			// Post-process to ensure deviceScaleFactor has .0 suffix
			const jsonWithFloats = jsonString.replace(
				/"deviceScaleFactor"\s*:\s*1([,\s}])/g,
				'"deviceScaleFactor": 1.0$1',
			);

			const blob = new Blob([jsonWithFloats], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${name}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("[RecordingPanel] Failed to download:", error);
			alert(
				`Failed to download: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	const handleClear = async () => {
		try {
			await clearRecording();
			setScriptName("");
		} catch (error) {
			console.error("[RecordingPanel] Failed to clear:", error);
		}
	};

	if (isLoading) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography variant="body1">Loading...</Typography>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				p: 2.5,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 2.5,
				overflow: "auto",
				background:
					"linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)",
			}}
		>
			{/* Recording Controls Card */}
			<Card
				sx={{
					boxShadow:
						"0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
					flexShrink: 0,
					borderRadius: "12px",
					border: "1px solid rgba(0,0,0,0.06)",
					transition: "all 0.3s ease",
					"&:hover": {
						boxShadow:
							"0 4px 6px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.08)",
						transform: "translateY(-2px)",
					},
				}}
			>
				<Stack spacing={2} sx={{ p: 2.5 }}>
					{!state.isRecording ? (
						<Button
							variant="contained"
							color="primary"
							onClick={handleStartRecording}
							size="large"
							fullWidth
							sx={{
								py: 1.75,
								fontSize: "16px",
								fontWeight: 600,
								textTransform: "none",
								borderRadius: "8px",
								background:
									"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
								boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
								transition: "all 0.3s ease",
								"&:hover": {
									background:
										"linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
									boxShadow:
										"0 6px 20px rgba(37, 99, 235, 0.4)",
									transform: "translateY(-1px)",
								},
								"&:active": {
									transform: "translateY(0)",
								},
							}}
						>
							🎬 Start Recording
						</Button>
					) : (
						<Stack direction="row" spacing={1.5}>
							<Button
								variant="outlined"
								onClick={handlePause}
								fullWidth
								sx={{
									textTransform: "none",
									fontWeight: 600,
									py: 1.5,
									borderRadius: "8px",
									borderWidth: "2px",
									borderColor: "#2563eb",
									color: "#2563eb",
									transition: "all 0.3s ease",
									"&:hover": {
										borderWidth: "2px",
										borderColor: "#1d4ed8",
										backgroundColor:
											"rgba(37, 99, 235, 0.04)",
										transform: "translateY(-1px)",
										boxShadow:
											"0 4px 12px rgba(37, 99, 235, 0.2)",
									},
								}}
							>
								{state.isPaused ? "▶️ Resume" : "⏸️ Pause"}
							</Button>
							<Button
								variant="contained"
								color="error"
								onClick={handleStopRecording}
								fullWidth
								sx={{
									textTransform: "none",
									fontWeight: 600,
									py: 1.5,
									borderRadius: "8px",
									background:
										"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
									boxShadow:
										"0 4px 12px rgba(239, 68, 68, 0.3)",
									transition: "all 0.3s ease",
									"&:hover": {
										background:
											"linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
										boxShadow:
											"0 6px 20px rgba(239, 68, 68, 0.4)",
										transform: "translateY(-1px)",
									},
								}}
							>
								⏹️ Stop
							</Button>
						</Stack>
					)}
				</Stack>
			</Card>

			{/* Recorded Actions Card */}
			<Card
				sx={{
					flex: state.actionsList.length > 0 ? 1 : "none",
					flexShrink: 0,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					boxShadow:
						"0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
					minHeight: "fit-content",
					borderRadius: "12px",
					border: "1px solid rgba(0,0,0,0.06)",
					transition: "all 0.3s ease",
				}}
			>
				<Box
					sx={{
						p: 2,
						borderBottom: "1px solid rgba(0,0,0,0.06)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						background:
							"linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)",
					}}
				>
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 600, fontSize: "15px" }}
					>
						📋 Recorded Actions
						{state.actionsList.length > 0 && (
							<Typography
								variant="body2"
								component="span"
								sx={{
									ml: 1,
									color: "text.secondary",
									fontSize: "14px",
								}}
							>
								({state.actionsList.length})
							</Typography>
						)}
					</Typography>
					{state.actionsList.length > 0 && (
						<Button
							variant="text"
							size="small"
							onClick={handleClear}
							sx={{
								color: "#ef4444",
								textTransform: "none",
								minWidth: "auto",
								px: 1.5,
								py: 0.5,
								borderRadius: "6px",
								fontWeight: 600,
								transition: "all 0.2s ease",
								"&:hover": {
									backgroundColor: "rgba(239, 68, 68, 0.1)",
									transform: "scale(1.05)",
								},
							}}
						>
							🗑️ Clear
						</Button>
					)}
				</Box>

				<Box
					sx={{
						flex: state.actionsList.length > 0 ? 1 : "none",
						overflow:
							state.actionsList.length > 0 ? "auto" : "visible",
						p: 2,
					}}
				>
					{state.actionsList.length === 0 ? (
						<Box
							sx={{
								textAlign: "center",
								py: 4,
								color: "text.secondary",
							}}
						>
							<Box
								sx={{
									fontSize: "48px",
									mb: 2,
									opacity: 0.6,
								}}
							>
								📝
							</Box>
							<Typography
								variant="body1"
								sx={{
									mb: 1,
									fontWeight: 600,
									color: "#374151",
									fontSize: "15px",
								}}
							>
								No actions recorded yet
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: "#6b7280",
									fontSize: "13px",
								}}
							>
								{state.isRecording
									? "Interact with the page to start recording actions"
									: 'Click "Start Recording" to begin'}
							</Typography>
						</Box>
					) : (
						<Stack spacing={1}>
							{state.actionsList.map((action, index) => (
								<ActionCard
									key={`${action.timestamp}-${index}`}
									action={action}
									index={index}
								/>
							))}
						</Stack>
					)}
				</Box>
			</Card>

			{/* Save/Download Section - Always visible */}
			<Card
				sx={{
					boxShadow:
						"0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
					flexShrink: 0,
					borderRadius: "12px",
					border: "1px solid rgba(0,0,0,0.06)",
					transition: "all 0.3s ease",
					"&:hover": {
						boxShadow:
							"0 4px 6px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.08)",
						transform: "translateY(-2px)",
					},
				}}
			>
				<Stack spacing={2} sx={{ p: 2.5 }}>
					<TextField
						label="Script Name"
						placeholder="Enter script name (optional)"
						value={scriptName}
						onChange={(e) => setScriptName(e.target.value)}
						size="small"
						fullWidth
						disabled={state.actionsList.length === 0}
						sx={{
							"& .MuiOutlinedInput-root": {
								borderRadius: "8px",
								transition: "all 0.3s ease",
								"&:hover": {
									boxShadow:
										"0 0 0 3px rgba(37, 99, 235, 0.08)",
								},
								"&.Mui-focused": {
									boxShadow:
										"0 0 0 3px rgba(37, 99, 235, 0.12)",
								},
							},
						}}
					/>
					<Stack direction="row" spacing={1.5}>
						<Button
							variant="outlined"
							onClick={handleSave}
							fullWidth
							disabled={state.actionsList.length === 0}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								py: 1.25,
								borderRadius: "8px",
								borderWidth: "2px",
								borderColor: "#10b981",
								color: "#10b981",
								transition: "all 0.3s ease",
								"&:hover": {
									borderWidth: "2px",
									borderColor: "#059669",
									backgroundColor: "rgba(16, 185, 129, 0.04)",
									transform: "translateY(-1px)",
									boxShadow:
										"0 4px 12px rgba(16, 185, 129, 0.2)",
								},
								"&:disabled": {
									borderColor: "rgba(0,0,0,0.12)",
								},
							}}
						>
							💾 Save
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={handleDownload}
							fullWidth
							disabled={state.actionsList.length === 0}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								py: 1.25,
								borderRadius: "8px",
								background:
									"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
								boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
								transition: "all 0.3s ease",
								"&:hover": {
									background:
										"linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
									boxShadow:
										"0 6px 20px rgba(37, 99, 235, 0.4)",
									transform: "translateY(-1px)",
								},
								"&:disabled": {
									background: "rgba(0,0,0,0.12)",
								},
							}}
						>
							⬇️ Download
						</Button>
					</Stack>
				</Stack>
			</Card>
		</Box>
	);
};

interface ActionCardProps {
	action: RecordedAction;
	index: number;
}

const ActionCard: FC<ActionCardProps> = ({ action, index }) => {
	const getActionIcon = (type: string) => {
		switch (type) {
			case "CLICK":
				return "🖱️";
			case "TYPE":
				return "⌨️";
			case "NAVIGATE":
				return "🌐";
			case "SELECT":
				return "📋";
			case "CHECK":
			case "UNCHECK":
				return "☑️";
			case "SCROLL":
				return "📜";
			default:
				return "▶️";
		}
	};

	const formatSelector = (selectors?: string[]) => {
		if (!selectors || selectors.length === 0) return "No selector";
		return selectors[0].length > 60
			? `${selectors[0].substring(0, 60)}...`
			: selectors[0];
	};

	return (
		<Box
			sx={{
				p: 1.75,
				border: "1px solid rgba(0,0,0,0.08)",
				borderRadius: "8px",
				background:
					"linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)",
				fontSize: "13px",
				transition: "all 0.2s ease",
				"&:hover": {
					borderColor: "#2563eb",
					boxShadow: "0 2px 8px rgba(37, 99, 235, 0.12)",
					transform: "translateX(4px)",
				},
			}}
		>
			<Box
				sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}
			>
				<Typography
					variant="caption"
					sx={{
						fontWeight: 700,
						color: "#2563eb",
						backgroundColor: "rgba(37, 99, 235, 0.1)",
						px: 0.75,
						py: 0.25,
						borderRadius: "4px",
						fontSize: "11px",
					}}
				>
					#{index + 1}
				</Typography>
				<span>{getActionIcon(action.type)}</span>
				<Typography
					variant="caption"
					sx={{
						fontWeight: 600,
						color: "#1f2937",
						fontSize: "13px",
					}}
				>
					{action.type}
				</Typography>
			</Box>

			{action.selector && action.selector.length > 0 && (
				<Typography
					variant="caption"
					sx={{
						display: "block",
						color: "#6b7280",
						fontFamily: "monospace",
						backgroundColor: "#f9fafb",
						px: 1,
						py: 0.5,
						borderRadius: "4px",
						fontSize: "12px",
					}}
				>
					{formatSelector(action.selector)}
				</Typography>
			)}

			{action.text && (
				<Typography
					variant="caption"
					sx={{
						display: "block",
						color: "#2563eb",
						mt: 0.5,
						fontWeight: 500,
					}}
				>
					Value:{" "}
					{action.text.length > 50
						? `${action.text.substring(0, 50)}...`
						: action.text}
				</Typography>
			)}

			{action.url && (
				<Typography
					variant="caption"
					sx={{
						display: "block",
						color: "#2563eb",
						mt: 0.5,
						fontWeight: 500,
					}}
				>
					URL: {action.url}
				</Typography>
			)}
		</Box>
	);
};

// CSS for pulse animation
const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
if (document.head) {
	document.head.appendChild(style);
}
