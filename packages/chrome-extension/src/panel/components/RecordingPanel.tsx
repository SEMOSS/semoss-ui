/**
 * RecordingPanel Component
 * Displays recording controls and action history in the side panel
 */

import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX transform
import React, { useEffect, useState } from "react";
import {
	Backdrop,
	Box,
	Button,
	Card,
	CircularProgress,
	Stack,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import type { RecordedAction } from "../../recorder/types";
import { AuthService, type Project } from "../../services/authService";
import { useRecordingState } from "../../services/recordingStateManager";

interface SaveRecordingResponse {
	success?: boolean;
	fileName?: string;
	message?: string;
}

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
	const notification = useNotification();
	const [scriptName, setScriptName] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [selectedProject, setSelectedProject] = useState<string | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [showNewProjectInput, setShowNewProjectInput] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");
	const [isCreatingProject, setIsCreatingProject] = useState(false);

	// Function to refresh project list
	const refreshProjects = async () => {
		const authenticated = await AuthService.isAuthenticated();
		if (authenticated) {
			try {
				const projectsList = await AuthService.getUpdatedProjects();
				const editableProjects = projectsList.filter((p) => p.canEdit);
				setProjects(editableProjects);
			} catch (error) {
				console.error("Failed to refresh projects:", error);
			}
		}
	};

	// Check authentication status on mount and when storage changes
	useEffect(() => {
		const checkAuth = async () => {
			const authenticated = await AuthService.isAuthenticated();
			setIsAuthenticated(authenticated);

			// Load projects if authenticated
			if (authenticated) {
				const projectsList = await AuthService.getProjects();
				const editableProjects = projectsList.filter((p) => p.canEdit);
				setProjects(editableProjects);
			} else {
				setProjects([]);
			}
		};

		// Initial check
		checkAuth();

		// Listen for storage changes (when user saves credentials in Settings)
		const handleStorageChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			if (
				areaName === "local" &&
				(changes.isAuthenticated ||
					changes.selectedProject ||
					changes.projects)
			) {
				checkAuth();
			}
		};

		// Listen for visibility changes to refresh projects when panel becomes visible
		const handleVisibilityChange = () => {
			if (!document.hidden && isAuthenticated) {
				refreshProjects();
			}
		};

		chrome.storage.onChanged.addListener(handleStorageChange);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		// Cleanup listeners on unmount
		return () => {
			chrome.storage.onChanged.removeListener(handleStorageChange);
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
		};
	}, [isAuthenticated]);

	const handleSettings = () => {
		// Open the extension options page
		chrome.runtime.openOptionsPage();
	};

	const handleProjectChange = async (newProjectId: string) => {
		if (newProjectId === "__NEW_PROJECT__") {
			setShowNewProjectInput(true);
			setNewProjectName("");
			return;
		}

		setShowNewProjectInput(false);
		setSelectedProject(newProjectId);
		await AuthService.saveSelectedProject(newProjectId);
		notification.add({
			color: "success",
			message: "Project selection saved",
			autoClose: 3000,
		});
	};

	const handleNewProjectCreation = async () => {
		const projectName = newProjectName.trim();

		if (!projectName) {
			notification.add({
				color: "error",
				message: "Please enter a project name",
				autoClose: 3000,
			});
			return;
		}

		// Validate project name (must start with letter, only letters/numbers/spaces)
		if (!/^[a-zA-Z][a-zA-Z0-9 ]*$/.test(projectName)) {
			notification.add({
				color: "error",
				message:
					"Invalid project name. Must start with a letter and contain only letters, numbers, and spaces.",
				autoClose: 3000,
			});
			return;
		}

		setIsCreatingProject(true);

		try {
			notification.add({
				color: "info",
				message: `Creating project "${projectName}"...`,
				autoClose: 3000,
			});

			// Step 1: Create the project
			const newProjectId = await AuthService.createProject(projectName);
			console.log("Project created with ID:", newProjectId);

			notification.add({
				color: "info",
				message: "Project created! Cloning portal template...",
				autoClose: 3000,
			});

			// Step 2: Clone portals to the new project
			await AuthService.clonePortalsToProject(newProjectId);
			console.log("Portals cloned successfully");

			notification.add({
				color: "info",
				message: "Portals cloned! Adding MCP and Playwright tags...",
				autoClose: 3000,
			});

			// Step 3: Add MCP and PLAYWRIGHT tags so project shows in playground
			await AuthService.addPlaywrightTags(newProjectId);
			console.log("Tags added successfully");

			notification.add({
				color: "info",
				message: "Tags added! Refreshing project list...",
				autoClose: 3000,
			});

			// Step 4: Get updated project list
			const updatedProjects = await AuthService.getUpdatedProjects();
			console.log("Updated projects:", updatedProjects);

			// Update projects list with only editable projects
			const editableProjects = updatedProjects.filter((p) => p.canEdit);
			setProjects(editableProjects);

			// Step 5: Save the new project as selected
			await AuthService.saveSelectedProject(newProjectId);
			setSelectedProject(newProjectId);

			// Step 6: Reset UI state
			setShowNewProjectInput(false);
			setNewProjectName("");

			notification.add({
				color: "success",
				message: `✅ Project "${projectName}" created successfully! Recordings will be saved here.`,
				autoClose: 3000,
			});
		} catch (error) {
			console.error("Project creation failed:", error);
			notification.add({
				color: "error",
				message: `Failed to create project: ${error instanceof Error ? error.message : "Unknown error"}`,
				autoClose: 3000,
			});
		} finally {
			setIsCreatingProject(false);
		}
	};

	const handleStartRecording = async () => {
		try {
			await startRecording();
		} catch (error) {
			console.error("[RecordingPanel] Failed to start recording:", error);
			notification.add({
				color: "error",
				message: `Failed to start recording: ${error instanceof Error ? error.message : "Unknown error"}`,
				autoClose: 3000,
			});
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
			console.error(
				"[RecordingPanel] Failed to pause/resume recording:",
				error,
			);
		}
	};

	const handleSave = async () => {
		try {
			// Check if authenticated
			if (!isAuthenticated || !selectedProject) {
				notification.add({
					color: "error",
					message:
						"Please configure Semoss credentials (Click ⚙️ Settings icon)",
					autoClose: 3000,
				});
				return;
			}

			// Get stored credentials
			const credentials = await AuthService.getCredentials();
			if (!credentials) {
				notification.add({
					color: "error",
					message:
						"Authentication credentials not found. Please reconfigure in settings.",
					autoClose: 3000,
				});
				return;
			}

			// Generate Playwright JSON
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

			// Format JSON with proper indentation (4 spaces to match Playwright unified format)
			const jsonString = JSON.stringify(playwrightJson, replacer, 4);

			// Build Semoss pixel expression
			const escapedJson = jsonString
				.replace(/"/g, '\\"')
				.replace(/\n/g, "\\n");
			const expression = `SaveRecordingFromExtension(project=["${selectedProject}"], name=["${name}"], jsonPayload=["${escapedJson}"], clientKey=["${credentials.clientKey}"], secretKey=["${credentials.secretKey}"]);`;

			console.log("[RecordingPanel] Saving recording to Semoss...");

			// Send to Semoss
			const response = await fetch(
				`${credentials.endpointUrl}/api/engine/runPixel`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						expression: expression,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}

			const rawData = await response.json();

			// Unwrap Pixel engine response format
			let data: SaveRecordingResponse;
			if (
				rawData.pixelReturn &&
				Array.isArray(rawData.pixelReturn) &&
				rawData.pixelReturn.length > 0
			) {
				data = rawData.pixelReturn[0].output;
			} else {
				data = rawData;
			}

			if (data && data.success) {
				notification.add({
					color: "success",
					message: `Recording saved successfully: ${data.fileName || name}`,
					autoClose: 3000,
				});
			} else {
				throw new Error(data?.message || "Failed to save recording");
			}
		} catch (error) {
			console.error("[RecordingPanel] Failed to save:", error);
			notification.add({
				color: "error",
				message: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
				autoClose: 3000,
			});
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

			// Create blob and download with custom JSON formatting (4 spaces to match Playwright unified format)
			const jsonString = JSON.stringify(playwrightJson, replacer, 4); // Post-process to ensure deviceScaleFactor has .0 suffix
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
			notification.add({
				color: "error",
				message: `Failed to download: ${error instanceof Error ? error.message : "Unknown error"}`,
				autoClose: 3000,
			});
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
		<>
			{/* Full Page Loading Overlay */}
			<Backdrop
				open={isCreatingProject}
				sx={{
					color: "#fff",
					zIndex: 9999,
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backdropFilter: "blur(4px)",
					backgroundColor: "rgba(15, 23, 42, 0.7)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 2,
				}}
			>
				<CircularProgress
					size={60}
					thickness={4}
					sx={{
						color: "#10b981",
					}}
				/>
				<Typography
					variant="h6"
					sx={{
						color: "#ffffff",
						fontWeight: 600,
						mt: 2,
					}}
				>
					Creating Project...
				</Typography>
				<Typography
					variant="body2"
					sx={{
						color: "rgba(255, 255, 255, 0.7)",
					}}
				>
					This may take a few moments...
				</Typography>
			</Backdrop>

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
				{/* Header with Settings */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: -1,
					}}
				>
					<Typography
						variant="h6"
						sx={{
							fontWeight: 700,
							color: "#1e293b",
							fontSize: "18px",
						}}
					>
						🎬 Recording Panel
					</Typography>
					<Button
						onClick={handleSettings}
						variant="text"
						size="small"
						sx={{
							minWidth: "36px",
							width: "36px",
							height: "36px",
							padding: 0,
							borderRadius: "50%",
							color: "#64748b",
							fontSize: "20px",
							transition: "all 0.2s ease",
							"&:hover": {
								color: "#2563eb",
								backgroundColor: "rgba(37, 99, 235, 0.08)",
								transform: "rotate(90deg)",
							},
						}}
						title="Settings"
					>
						⚙️
					</Button>
				</Box>

				{/* Authentication Status Banner */}
				{!isAuthenticated && (
					<Card
						sx={{
							width: "100%",
							backgroundColor: "#fff3cd",
							borderLeft: "4px solid #ffc107",
							borderRadius: "8px",
							p: 2,
							boxShadow: "none",
							flexShrink: 0,
						}}
					>
						<Stack spacing={1} sx={{ width: "100%" }}>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 600, color: "#856404" }}
							>
								⚠️ Authentication Required
							</Typography>
							<Typography
								variant="body2"
								sx={{ color: "#856404" }}
							>
								Please configure your Semoss credentials to save
								recordings.
							</Typography>
							<Button
								variant="outlined"
								size="small"
								onClick={handleSettings}
								sx={{
									mt: 0.5,
									borderColor: "#ffc107",
									color: "#856404",
									textTransform: "none",
									fontWeight: 600,
									alignSelf: "flex-start",
									"&:hover": {
										borderColor: "#e0a800",
										backgroundColor:
											"rgba(255, 193, 7, 0.08)",
									},
								}}
							>
								⚙️ Open Settings
							</Button>
						</Stack>
					</Card>
				)}

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
									boxShadow:
										"0 4px 12px rgba(37, 99, 235, 0.3)",
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
										backgroundColor:
											"rgba(239, 68, 68, 0.1)",
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
								state.actionsList.length > 0
									? "auto"
									: "visible",
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
						{/* Project Selection Dropdown */}
						{isAuthenticated && projects.length > 0 && (
							<Box>
								<Typography
									variant="caption"
									sx={{
										mb: 1,
										display: "block",
										fontWeight: 600,
										color: "#1e293b",
										fontSize: "0.875rem",
									}}
								>
									📁 Select Project
								</Typography>
								<select
									value={
										showNewProjectInput
											? "__NEW_PROJECT__"
											: selectedProject || ""
									}
									onChange={(e) =>
										handleProjectChange(e.target.value)
									}
									onMouseDown={() => refreshProjects()}
									disabled={
										state.actionsList.length === 0 ||
										isCreatingProject
									}
									style={{
										width: "100%",
										padding: "12px 36px 12px 16px",
										border: "2px solid #cbd5e1",
										borderRadius: "10px",
										fontSize: "14.5px",
										fontWeight: "500",
										fontFamily: "inherit",
										background:
											"linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)",
										backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23475569' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
										cursor: "pointer",
										transition: "all 0.2s ease",
										outline: "none",
										boxShadow:
											"0 1px 3px rgba(0, 0, 0, 0.08)",
										appearance: "none",
										backgroundPosition: "right 10px center",
										backgroundRepeat: "no-repeat",
										backgroundSize: "20px 20px",
									}}
									onFocus={(e) => {
										e.target.style.borderColor = "#2563eb";
										e.target.style.boxShadow =
											"0 0 0 3px rgba(37, 99, 235, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)";
										e.target.style.borderWidth = "2px";
									}}
									onBlur={(e) => {
										e.target.style.borderColor = "#cbd5e1";
										e.target.style.boxShadow =
											"0 1px 3px rgba(0, 0, 0, 0.08)";
									}}
								>
									<option
										value=""
										disabled
										style={{ cursor: "pointer" }}
									>
										-- Select a project --
									</option>
									<option
										value="__NEW_PROJECT__"
										style={{
											fontWeight: 600,
											color: "#10b981",
											cursor: "pointer",
										}}
									>
										+ Create New Project
									</option>
									{projects.map((project) => (
										<option
											key={project.id}
											value={project.id}
											style={{ cursor: "pointer" }}
										>
											{project.displayName ||
												project.name}
										</option>
									))}
								</select>
								{showNewProjectInput && (
									<Box sx={{ mt: 2 }}>
										<TextField
											label="New Project Name"
											placeholder="Enter project name (e.g., My Extension Project)"
											value={newProjectName}
											onChange={(e) =>
												setNewProjectName(
													e.target.value,
												)
											}
											size="small"
											fullWidth
											disabled={isCreatingProject}
											onKeyPress={(e) => {
												if (
													e.key === "Enter" &&
													!isCreatingProject
												) {
													handleNewProjectCreation();
												}
											}}
											sx={{
												"& .MuiOutlinedInput-root": {
													borderRadius: "8px",
												},
											}}
										/>
										<Typography
											variant="caption"
											sx={{
												mt: 0.5,
												display: "block",
												color: "#64748b",
											}}
										>
											Must start with a letter and contain
											only letters, numbers, and spaces
										</Typography>
										<Button
											variant="contained"
											color="primary"
											onClick={handleNewProjectCreation}
											fullWidth
											disabled={
												isCreatingProject ||
												!newProjectName.trim()
											}
											sx={{
												mt: 1.5,
												py: 1.25,
												textTransform: "none",
												fontWeight: 600,
												borderRadius: "8px",
												background:
													"linear-gradient(135deg, #10b981 0%, #059669 100)",
												"&:hover": {
													background:
														"linear-gradient(135deg, #059669 0%, #047857 100%)",
												},
											}}
										>
											{isCreatingProject
												? "Creating Project..."
												: "Create Project"}
										</Button>
									</Box>
								)}
							</Box>
						)}

						<TextField
							label="Script Name"
							placeholder="Enter script name (optional)"
							value={scriptName}
							onChange={(e) => setScriptName(e.target.value)}
							size="small"
							fullWidth
							disabled={
								state.actionsList.length === 0 ||
								isCreatingProject
							}
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
								disabled={
									state.actionsList.length === 0 ||
									isCreatingProject
								}
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
										backgroundColor:
											"rgba(16, 185, 129, 0.04)",
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
								disabled={
									state.actionsList.length === 0 ||
									isCreatingProject
								}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									py: 1.25,
									borderRadius: "8px",
									background:
										"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
									boxShadow:
										"0 4px 12px rgba(37, 99, 235, 0.3)",
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
		</>
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
