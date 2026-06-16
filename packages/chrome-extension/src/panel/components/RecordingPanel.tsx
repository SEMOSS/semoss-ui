/**
 * RecordingPanel Component
 * Displays recording controls and action history in the side panel
 */

import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX transform
import React, { useEffect, useId, useState } from "react";
import {
	Button,
	Card,
	cn,
	Field,
	FieldLabel,
	H4,
	Input,
	Muted,
	P,
	Small,
	toast,
	useLoadingScreen,
} from "@semoss/ui/next";
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
	const loadingScreen = useLoadingScreen();
	const [scriptName, setScriptName] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [selectedProject, setSelectedProject] = useState<string | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [showNewProjectInput, setShowNewProjectInput] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");
	const [isCreatingProject, setIsCreatingProject] = useState(false);
	const newProjectNameId = useId();
	const scriptNameId = useId();

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
	}, [isAuthenticated, refreshProjects]);

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
		toast.success("Project selection saved", { duration: 3000 });
	};

	const handleNewProjectCreation = async () => {
		const projectName = newProjectName.trim();

		if (!projectName) {
			toast.error("Please enter a project name", { duration: 3000 });
			return;
		}

		// Validate project name (must start with letter, only letters/numbers/spaces)
		if (!/^[a-zA-Z][a-zA-Z0-9 ]*$/.test(projectName)) {
			toast.error(
				"Invalid project name. Must start with a letter and contain only letters, numbers, and spaces.",
				{ duration: 3000 },
			);
			return;
		}

		setIsCreatingProject(true);
		loadingScreen.start(
			"Creating Project...",
			"This may take a few moments...",
		);
		try {
			toast.info(`Creating project "${projectName}"...`, {
				duration: 3000,
			});

			// Step 1: Create the project
			const newProjectId = await AuthService.createProject(projectName);
			console.log("Project created with ID:", newProjectId);

			toast.info("Project created! Cloning portal template...", {
				duration: 3000,
			});

			// Step 2: Clone portals to the new project
			await AuthService.clonePortalsToProject(newProjectId);
			console.log("Portals cloned successfully");

			toast.info("Portals cloned! Adding MCP and Playwright tags...", {
				duration: 3000,
			});

			// Step 3: Add MCP and PLAYWRIGHT tags so project shows in playground
			await AuthService.addPlaywrightTags(newProjectId);
			console.log("Tags added successfully");

			toast.info("Tags added! Refreshing project list...", {
				duration: 3000,
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

			toast.success(
				`✅ Project "${projectName}" created successfully! Recordings will be saved here.`,
				{ duration: 3000 },
			);
		} catch (error) {
			console.error("Project creation failed:", error);
			toast.error(
				`Failed to create project: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ duration: 3000 },
			);
		} finally {
			setIsCreatingProject(false);
			loadingScreen.stop();
		}
	};

	const handleStartRecording = async () => {
		try {
			await startRecording();
		} catch (error) {
			console.error("[RecordingPanel] Failed to start recording:", error);
			toast.error(
				`Failed to start recording: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ duration: 3000 },
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
				toast.error(
					"Please configure Semoss credentials (Click ⚙️ Settings icon)",
					{ duration: 3000 },
				);
				return;
			}

			// Get stored credentials
			const credentials = await AuthService.getCredentials();
			if (!credentials) {
				toast.error(
					"Authentication credentials not found. Please reconfigure in settings.",
					{ duration: 3000 },
				);
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

			if (data?.success) {
				toast.success(
					`Recording saved successfully: ${data.fileName || name}`,
					{ duration: 3000 },
				);
			} else {
				throw new Error(data?.message || "Failed to save recording");
			}
		} catch (error) {
			console.error("[RecordingPanel] Failed to save:", error);
			toast.error(
				`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ duration: 3000 },
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
			toast.error(
				`Failed to download: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ duration: 3000 },
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
			<div className={cn("p-3")}>
				<P>Loading...</P>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex h-full flex-col gap-4 overflow-auto p-4",
				"bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]",
			)}
		>
			{/* Header with Settings */}
			<div className={cn("-mb-1 flex items-center justify-between")}>
				<H4 className="font-bold text-[#1e293b] text-[18px]">
					🎬 Recording Panel
				</H4>
				<Button
					onClick={handleSettings}
					variant="ghost"
					size="sm"
					className="size-9 min-w-9 rounded-full text-slate-500 text-xl transition-all hover:rotate-90 hover:bg-blue-600/8 hover:text-blue-600"
					title="Settings"
				>
					⚙️
				</Button>
			</div>

			{/* Authentication Status Banner */}
			{!isAuthenticated && (
				<Card className="w-full flex-shrink-0 rounded-xl border-l-4 border-l-[#ffc107] bg-[#fff3cd] p-5 shadow-none">
					<div className="flex w-full flex-col gap-3">
						<P className="font-semibold text-[#856404]">
							⚠️ Authentication Required
						</P>
						<Small className="text-[#856404]">
							Please configure your Semoss credentials to save
							recordings.
						</Small>
						<Button
							variant="outline"
							size="sm"
							onClick={handleSettings}
							className="mt-1 self-start rounded-lg border-2 border-amber-500 bg-white px-4 py-2 font-semibold text-amber-700 text-sm hover:bg-amber-50"
						>
							⚙️ Open Settings
						</Button>
					</div>
				</Card>
			)}

			{/* Recording Controls Card */}
			<Card className="hover:-translate-y-0.5 flex-shrink-0 rounded-xl border border-black/[0.06] shadow-sm transition-all duration-300 hover:shadow-lg">
				<div className="flex flex-col gap-4 p-6">
					{!state.isRecording ? (
						<Button
							variant="default"
							onClick={handleStartRecording}
							size="lg"
							className="w-full rounded-xl bg-blue-600 px-6 py-8 font-semibold text-lg text-white hover:bg-blue-700"
						>
							🎬 Start Recording
						</Button>
					) : (
						<div className="flex flex-row gap-4">
							<Button
								variant="outline"
								onClick={handlePause}
								className="w-full rounded-xl border-2 border-blue-600 bg-white px-6 py-6 font-semibold text-base text-blue-600 hover:bg-blue-50"
							>
								{state.isPaused ? "▶️ Resume" : "⏸️ Pause"}
							</Button>
							<Button
								variant="destructive"
								onClick={handleStopRecording}
								className="w-full rounded-xl bg-red-600 px-6 py-6 font-semibold text-base text-white hover:bg-red-700"
							>
								⏹️ Stop
							</Button>
						</div>
					)}
				</div>
			</Card>

			{/* Recorded Actions Card */}
			<Card
				className={cn(
					"flex min-h-fit flex-shrink-0 flex-col overflow-hidden rounded-xl border border-black/[0.06] shadow-sm transition-all duration-300",
					state.actionsList.length > 0 ? "flex-1" : "flex-none",
				)}
			>
				<div
					className={cn(
						"flex items-center justify-between border-black/[0.06] border-b bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] p-4",
					)}
				>
					<P className="font-semibold text-[15px]">
						📋 Recorded Actions
						{state.actionsList.length > 0 && (
							<Muted className="ml-2 text-[14px]">
								({state.actionsList.length})
							</Muted>
						)}
					</P>
					{state.actionsList.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClear}
							className="min-w-fit rounded-lg px-4 py-2 font-semibold text-red-500 text-sm hover:bg-red-50"
						>
							🗑️ Clear
						</Button>
					)}
				</div>

				<div
					className={cn(
						"p-4",
						state.actionsList.length > 0 ? "flex-1" : "flex-none",
						state.actionsList.length > 0
							? "overflow-auto"
							: "overflow-visible",
					)}
				>
					{state.actionsList.length === 0 ? (
						<div
							className={cn(
								"py-4 text-center text-muted-foreground",
							)}
						>
							<div className={cn("mb-2 text-[48px] opacity-60")}>
								📝
							</div>
							<P className="mb-2 font-semibold text-[#374151] text-[15px]">
								No actions recorded yet
							</P>
							<Small className="text-[#6b7280] text-[13px]">
								{state.isRecording
									? "Interact with the page to start recording actions"
									: 'Click "Start Recording" to begin'}
							</Small>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{state.actionsList.map((action, index) => (
								<ActionCard
									key={`${action.timestamp}-${index}`}
									action={action}
									index={index}
								/>
							))}
						</div>
					)}
				</div>
			</Card>

			{/* Save/Download Section - Always visible */}
			<Card className="hover:-translate-y-0.5 flex-shrink-0 rounded-xl border border-black/[0.06] shadow-sm transition-all duration-300 hover:shadow-lg">
				<div className="flex flex-col gap-4 p-6">
					{/* Project Selection Dropdown */}
					{isAuthenticated && projects.length > 0 && (
						<div>
							<Muted className="mb-2 block font-semibold text-[#1e293b] text-[0.875rem]">
								📁 Select Project
							</Muted>
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
									boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
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
										{project.displayName || project.name}
									</option>
								))}
							</select>
							{showNewProjectInput && (
								<div className={cn("mt-2")}>
									<Field className="w-full">
										<FieldLabel htmlFor={newProjectNameId}>
											New Project Name
										</FieldLabel>
										<Input
											id={newProjectNameId}
											placeholder="Enter project name (e.g., My Extension Project)"
											value={newProjectName}
											onChange={(e) =>
												setNewProjectName(
													e.target.value,
												)
											}
											disabled={isCreatingProject}
											onKeyPress={(e) => {
												if (
													e.key === "Enter" &&
													!isCreatingProject
												) {
													handleNewProjectCreation();
												}
											}}
											className="rounded-lg"
										/>
									</Field>
									<Muted className="mt-1 block text-[#64748b]">
										Must start with a letter and contain
										only letters, numbers, and spaces
									</Muted>
									<Button
										variant="default"
										onClick={handleNewProjectCreation}
										className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-5 font-semibold text-base text-white hover:bg-emerald-700"
										disabled={
											isCreatingProject ||
											!newProjectName.trim()
										}
									>
										{isCreatingProject
											? "Creating Project..."
											: "Create Project"}
									</Button>
								</div>
							)}
						</div>
					)}

					<Field className="w-full">
						<FieldLabel htmlFor={scriptNameId}>
							Script Name
						</FieldLabel>
						<Input
							id={scriptNameId}
							placeholder="Enter script name (optional)"
							value={scriptName}
							onChange={(e) => setScriptName(e.target.value)}
							disabled={
								state.actionsList.length === 0 ||
								isCreatingProject
							}
							className="rounded-lg transition-all duration-300 hover:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
						/>
					</Field>
					<div className="flex flex-row gap-3">
						<Button
							onClick={handleSave}
							className="w-full cursor-pointer rounded-lg border-[1.5px] border-emerald-500 bg-white px-5 py-3 font-semibold text-[15px] text-emerald-600 shadow-sm transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-50"
							disabled={
								state.actionsList.length === 0 ||
								isCreatingProject
							}
						>
							💾 Save
						</Button>
						<Button
							onClick={handleDownload}
							className="w-full cursor-pointer rounded-lg border-0 bg-blue-600 px-5 py-3 font-semibold text-[15px] text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
							disabled={
								state.actionsList.length === 0 ||
								isCreatingProject
							}
						>
							⬇️ Download
						</Button>
					</div>
				</div>
			</Card>
		</div>
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
		<div
			className={cn(
				"rounded-lg border border-black/[0.08] p-[7px]",
				"bg-gradient-to-b from-white to-[#fafafa]",
				"text-[13px] transition-all duration-200 ease-in-out",
				"hover:translate-x-1 hover:border-[#2563eb] hover:shadow-[0_2px_8px_rgba(37,99,235,0.12)]",
			)}
		>
			<div className={cn("mb-[3px] flex items-center gap-1")}>
				<Muted className="rounded bg-[rgba(37,99,235,0.1)] px-1.5 py-0.5 font-bold text-[#2563eb] text-[11px]">
					#{index + 1}
				</Muted>
				<span>{getActionIcon(action.type)}</span>
				<Muted className="font-semibold text-[#1f2937] text-[13px]">
					{action.type}
				</Muted>
			</div>

			{action.selector && action.selector.length > 0 && (
				<Muted className="block rounded bg-[#f9fafb] px-2 py-1 font-mono text-[#6b7280] text-[12px]">
					{formatSelector(action.selector)}
				</Muted>
			)}

			{action.text && (
				<Muted className="mt-1 block font-medium text-[#2563eb]">
					Value:{" "}
					{action.text.length > 50
						? `${action.text.substring(0, 50)}...`
						: action.text}
				</Muted>
			)}

			{action.url && (
				<Muted className="mt-1 block font-medium text-[#2563eb]">
					URL: {action.url}
				</Muted>
			)}
		</div>
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
