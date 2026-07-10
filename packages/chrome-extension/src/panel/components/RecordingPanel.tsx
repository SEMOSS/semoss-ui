/**
 * RecordingPanel Component
 * Displays recording controls and action history in the side panel
 */

import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX transform
import React, { useCallback, useEffect, useId, useState } from "react";
import {
	Button,
	Card,
	cn,
	H4,
	Muted,
	P,
	Small,
	toast,
	useLoadingScreen,
} from "@semoss/ui/next";
import type { RecordedAction } from "../../recorder/types";
import { AuthService, type Project } from "../../services/authService";
import {
	type DeleteImpact,
	DependencyAnalyzer,
} from "../../services/dependencyAnalyzer";
import { useRecordingState } from "../../services/recordingStateManager";
import { escapePixelString, SemossClient } from "../../services/semossClient";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

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
		updateAction,
		deleteAction,
	} = useRecordingState();
	const loadingScreen = useLoadingScreen();
	const [scriptName, setScriptName] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [selectedProject, setSelectedProject] = useState<string | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [showNewProjectInput, setShowNewProjectInput] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");
	const [isCreatingProject, setIsCreatingProject] = useState(false);
	const newProjectNameId = useId();
	const scriptNameId = useId();
	const projectSelectId = useId();

	// Check authentication status on mount and when storage changes
	useEffect(() => {
		const checkAuth = async () => {
			const authenticated = await AuthService.refreshAuthState();
			setIsAuthenticated(authenticated);

			// Load projects if authenticated - fetch fresh from SEMOSS
			if (authenticated) {
				try {
					const projectsList =
						await AuthService.fetchProjectsFromSemoss();
					const editableProjects = projectsList.filter(
						(p) => p.canEdit,
					);
					setProjects(editableProjects);
					console.log(
						`Loaded ${editableProjects.length} editable projects from SEMOSS`,
					);
				} catch (error) {
					console.error("Failed to fetch projects on mount:", error);
					// Fallback to storage if fetch fails
					const projectsList = await AuthService.getProjects();
					const editableProjects = projectsList.filter(
						(p) => p.canEdit,
					);
					setProjects(editableProjects);
				}
			} else {
				setProjects([]);
			}
		};

		// Initial check
		checkAuth();
	}, []);

	const handleGoogleLogin = async () => {
		try {
			setIsLoggingIn(true);
			const success = await AuthService.loginWithOAuth("google");
			if (success) {
				setIsAuthenticated(true);

				// Fetch projects from SEMOSS
				try {
					const projectsList =
						await AuthService.fetchProjectsFromSemoss();
					const editableProjects = projectsList.filter(
						(p) => p.canEdit,
					);
					setProjects(editableProjects);
					toast.success("Signed in with Google - Projects loaded", {
						duration: 3000,
					});
				} catch (error) {
					console.error("Failed to fetch projects:", error);
					toast.success("Signed in with Google", { duration: 3000 });
					toast.error("Could not load projects. Please refresh.", {
						duration: 3000,
					});
				}
			}
		} catch (error) {
			toast.error(
				`Sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ duration: 3000 },
			);
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleSemossLogin = async () => {
		try {
			setIsLoggingIn(true);
			const success = await AuthService.loginWithNative();
			if (success) {
				setIsAuthenticated(true);

				// Fetch projects from SEMOSS
				try {
					const projectsList =
						await AuthService.fetchProjectsFromSemoss();
					const editableProjects = projectsList.filter(
						(p) => p.canEdit,
					);
					setProjects(editableProjects);
					toast.success("Signed in with SEMOSS - Projects loaded", {
						duration: 3000,
					});
				} catch (error) {
					console.error("Failed to fetch projects:", error);
					toast.success("Signed in with SEMOSS", { duration: 3000 });
					toast.error("Could not load projects. Please refresh.", {
						duration: 3000,
					});
				}
			}
		} catch (error) {
			toast.error(
				`Sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ duration: 3000 },
			);
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleProjectChange = (value: string) => {
		if (value === "__NEW_PROJECT__") {
			setShowNewProjectInput(true);
			setSelectedProject(null);
			setNewProjectName("");
		} else {
			setShowNewProjectInput(false);
			setSelectedProject(value);
		}
	};

	const refreshProjects = async () => {
		if (!isAuthenticated) return;

		try {
			const projectsList = await AuthService.fetchProjectsFromSemoss();
			const editableProjects = projectsList.filter((p) => p.canEdit);
			setProjects(editableProjects);
			console.log(`Refreshed ${editableProjects.length} projects`);
		} catch (error) {
			console.error("Failed to refresh projects:", error);
		}
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

			toast.info("Project created! Setting up...", {
				duration: 3000,
			});

			// Step 2: Create portal from bundled template (no external dependencies)
			try {
				await AuthService.createPortalFromTemplate(newProjectId);
				console.log("Portal created successfully");
				toast.info("Portal UI created successfully", {
					duration: 2000,
				});
			} catch (error) {
				// Portal is optional but highly recommended for script management
				console.warn("Portal creation failed (non-critical):", error);
				toast.warning(
					"⚠️ Portal UI unavailable (you can still save recordings)",
					{ duration: 3000 },
				);
			}

			toast.info("Adding project tags...", {
				duration: 3000,
			});

			// Step 3: Add MCP and PLAYWRIGHT tags so project shows in playground
			await AuthService.addPlaywrightTags(newProjectId);
			console.log("Tags added successfully");

			toast.info("Tags added! Project created successfully.", {
				duration: 3000,
			});

			// Step 4: Fetch fresh project list from SEMOSS
			const projectsList = await AuthService.fetchProjectsFromSemoss();
			const editableProjects = projectsList.filter((p) => p.canEdit);
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
				toast.error("Please sign in with Google first", {
					duration: 3000,
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

			// Build Semoss pixel expression (no credentials needed - uses OAuth session)
			const expression = `SaveRecordingFromExtension(project=["${escapePixelString(selectedProject)}"], name=["${escapePixelString(name)}"], jsonPayload=["${escapePixelString(jsonString)}"]);`;

			console.log("[RecordingPanel] Saving recording to Semoss...");

			const data =
				await SemossClient.runPixel<SaveRecordingResponse>(expression);

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
				"flex flex-col gap-8 p-6",
				"bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]",
			)}
		>
			{/* Header */}
			<H4 className="font-bold text-[#1e293b] text-[18px]">
				🎬 Recording Panel
			</H4>

			{/* Authentication Status Banner */}
			{!isAuthenticated && (
				<Card className="mb-6 w-full flex-shrink-0 rounded-xl border border-slate-200 bg-white p-6 shadow-none">
					<div className="flex w-full flex-col items-center gap-4 text-center">
						<P className="font-semibold text-[#1e293b]">
							Sign in to save recordings
						</P>
						<Small className="text-slate-500">
							Sign in with your Google account or SEMOSS
							credentials to save recordings to Semoss.
						</Small>
						<Button
							variant="outline"
							onClick={handleGoogleLogin}
							disabled={isLoggingIn}
							className="mt-1 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-6 font-semibold text-slate-700 text-sm hover:bg-slate-50"
						>
							<svg
								aria-hidden="true"
								width="18"
								height="18"
								viewBox="0 0 18 18"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									fill="#4285F4"
									d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
								/>
								<path
									fill="#34A853"
									d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
								/>
								<path
									fill="#FBBC05"
									d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
								/>
								<path
									fill="#EA4335"
									d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
								/>
							</svg>
							{isLoggingIn
								? "Signing in…"
								: "Sign in with Google"}
						</Button>
						<Button
							variant="outline"
							onClick={handleSemossLogin}
							disabled={isLoggingIn}
							className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-6 font-semibold text-slate-700 text-sm hover:bg-slate-50"
						>
							<svg
								aria-hidden="true"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle cx="12" cy="12" r="10" fill="#667eea" />
								<text
									x="12"
									y="16"
									fontSize="12"
									fontWeight="bold"
									fill="white"
									textAnchor="middle"
								>
									S
								</text>
							</svg>
							{isLoggingIn
								? "Signing in…"
								: "Sign in with SEMOSS"}
						</Button>
					</div>
				</Card>
			)}

			{/* Recording Controls Card */}
			<Card className="hover:-translate-y-0.5 mb-6 flex-shrink-0 rounded-xl border border-black/[0.06] shadow-sm transition-all duration-300 hover:shadow-lg">
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
								variant="default"
								onClick={handlePause}
								className="w-full rounded-xl bg-blue-600 px-6 py-6 font-semibold text-base text-white hover:bg-blue-700"
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
					"mb-6 flex-shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm",
				)}
			>
				<div className="flex flex-col gap-5 p-5">
					{/* Header */}
					<div className="flex items-center justify-between border-slate-200 border-b pb-5">
						<P className="font-semibold text-[15px] text-slate-900">
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

					{/* Content */}
					{state.actionsList.length === 0 ? (
						<div className="py-4 text-center text-muted-foreground">
							<div className={cn("mb-3 text-[52px] opacity-50")}>
								📝
							</div>
							<P className="mb-2 font-semibold text-base text-slate-700">
								No actions recorded yet
							</P>
							<Small className="text-slate-500 text-sm">
								{state.isRecording
									? "Interact with the page to start recording actions"
									: 'Click "Start Recording" to begin'}
							</Small>
						</div>
					) : (
						<div className="-mx-5 flex max-h-[500px] flex-col gap-5 overflow-y-auto px-5">
							{state.actionsList.map((action, index) => (
								<ActionCard
									key={`${action.timestamp}-${index}`}
									action={action}
									index={index}
									allActions={state.actionsList}
									onUpdate={updateAction}
									onDelete={deleteAction}
								/>
							))}
						</div>
					)}
				</div>
			</Card>

			{/* Save/Download Section */}
			<Card className="flex-shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="flex flex-col gap-5 p-5">
					{/* Header */}
					<div className="flex items-center justify-between border-slate-200 border-b pb-3">
						<H4 className="font-semibold text-[15px] text-slate-900">
							Save & Export
						</H4>
					</div>

					{/* Project Dropdown */}
					<div className="space-y-2">
						<label
							htmlFor={projectSelectId}
							className="block font-medium text-slate-600 text-xs uppercase tracking-wide"
						>
							Project
						</label>
						<select
							id={projectSelectId}
							value={
								showNewProjectInput
									? "__NEW_PROJECT__"
									: selectedProject || ""
							}
							onChange={(e) =>
								handleProjectChange(e.target.value)
							}
							onMouseDown={() => refreshProjects()}
							disabled={!isAuthenticated || isCreatingProject}
							className={cn(
								"w-full appearance-none rounded-xl border px-4 py-3.5 pr-12",
								"font-medium text-[14px]",
								"bg-[center_right_1rem] bg-[length:1.25rem] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-white bg-no-repeat",
								"transition-all duration-200",
								"shadow-sm outline-none",
								// Enabled states
								!(!isAuthenticated || isCreatingProject) &&
									"cursor-pointer border-slate-200 text-slate-900 hover:border-indigo-300 hover:shadow-indigo-100/50 hover:shadow-md focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100",
								// Disabled states
								(!isAuthenticated || isCreatingProject) &&
									"cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60",
							)}
						>
							<option value="" disabled>
								-- Select a project --
							</option>
							{isAuthenticated && (
								<>
									<option
										value="__NEW_PROJECT__"
										className="font-semibold text-emerald-600"
									>
										✨ Create New Project
									</option>
									{projects.map((project) => (
										<option
											key={project.id}
											value={project.id}
										>
											{project.displayName ||
												project.name}
										</option>
									))}
								</>
							)}
						</select>

						{/* New Project Input */}
						{showNewProjectInput && (
							<div className="mt-5 space-y-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-sm">
								<div className="flex items-center gap-2">
									<span className="text-xl">✨</span>
									<span className="font-semibold text-emerald-800 text-sm">
										New Project
									</span>
								</div>
								<input
									type="text"
									id={newProjectNameId}
									placeholder="Enter project name"
									value={newProjectName}
									onChange={(e) =>
										setNewProjectName(e.target.value)
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
									className="w-full rounded-lg border-2 border-emerald-300 bg-white px-4 py-3 font-medium text-[15px] text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
								/>
								<Muted className="flex items-start gap-2 text-[12px] text-emerald-700 leading-relaxed">
									<span>💡</span>
									<span>
										Must start with a letter and contain
										only letters, numbers, and spaces
									</span>
								</Muted>
								<Button
									variant="default"
									onClick={handleNewProjectCreation}
									className="hover:-translate-y-0.5 w-full rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-[14px] text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg"
									disabled={
										isCreatingProject ||
										!newProjectName.trim()
									}
								>
									{isCreatingProject
										? "⏳ Creating..."
										: "✨ Create Project"}
								</Button>
							</div>
						)}
					</div>

					{/* Script Name Input */}
					<div className="space-y-2">
						<label
							htmlFor={scriptNameId}
							className="block font-medium text-slate-600 text-xs uppercase tracking-wide"
						>
							Script Name{" "}
							<span className="font-normal text-slate-400 lowercase">
								(optional)
							</span>
						</label>
						<input
							type="text"
							id={scriptNameId}
							placeholder="e.g., Login Test Script"
							value={scriptName}
							onChange={(e) => setScriptName(e.target.value)}
							disabled={isCreatingProject}
							className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-medium text-slate-900 text-sm transition-colors duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-50 disabled:opacity-60"
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-1">
						<Button
							onClick={handleSave}
							disabled={
								state.actionsList.length === 0 ||
								isCreatingProject
							}
							className="hover:-translate-y-0.5 flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-sm text-white shadow-sm transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
						>
							Save to Project
						</Button>
						<Button
							onClick={handleDownload}
							disabled={
								state.actionsList.length === 0 ||
								isCreatingProject
							}
							className="hover:-translate-y-0.5 flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 text-sm shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-white"
						>
							Download JSON
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
	allActions: RecordedAction[];
	onUpdate: (index: number, action: RecordedAction) => Promise<void>;
	onDelete: (index: number) => Promise<void>;
}

const ActionCard: FC<ActionCardProps> = ({
	action,
	index,
	allActions,
	onUpdate,
	onDelete,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedAction, setEditedAction] = useState(action);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [deleteImpact, setDeleteImpact] = useState<DeleteImpact | null>(null);

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
		return selectors[0].length > 80
			? `${selectors[0].substring(0, 80)}...`
			: selectors[0];
	};

	const handleSave = async () => {
		try {
			await onUpdate(index, editedAction);
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update action:", error);
			toast.error("Failed to update action");
		}
	};

	const handleCancel = () => {
		setEditedAction(action);
		setIsEditing(false);
	};

	const handleDelete = async () => {
		try {
			// Analyze dependencies before deletion
			const impact = DependencyAnalyzer.getDeleteImpact(
				allActions,
				index,
			);

			// If there are dependencies, show confirmation dialog
			if (impact.hasImpact) {
				setDeleteImpact(impact);
				setShowDeleteConfirmation(true);
			} else {
				// No dependencies, delete immediately
				await onDelete(index);
			}
		} catch (error) {
			console.error("Failed to delete action:", error);
			toast.error("Failed to delete action");
		}
	};

	const handleConfirmDelete = async () => {
		try {
			await onDelete(index);
			setShowDeleteConfirmation(false);
			setDeleteImpact(null);
		} catch (error) {
			console.error("Failed to delete action:", error);
			toast.error("Failed to delete action");
		}
	};

	const handleCancelDelete = () => {
		setShowDeleteConfirmation(false);
		setDeleteImpact(null);
	};

	return (
		<div
			className={cn(
				"rounded-lg border border-slate-200 p-5",
				"bg-white",
				"transition-all duration-150 ease-in-out",
				isEditing
					? "border-blue-300 shadow-md"
					: "hover:border-slate-300 hover:shadow-sm",
			)}
		>
			{/* Header with Action Type and Edit/Delete Buttons */}
			<div className="mb-4 flex items-center gap-2.5">
				<span className="text-lg">{getActionIcon(action.type)}</span>
				<span className="font-semibold text-slate-900 text-sm">
					{action.type}
				</span>
				<span className="ml-auto font-medium text-slate-400 text-xs">
					#{index + 1}
				</span>
				{!isEditing ? (
					<div className="ml-2 flex items-center gap-1.5">
						{action.type === "TYPE" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(true)}
								className="min-w-fit rounded-lg px-2.5 py-1.5 text-blue-600 text-xs transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm active:scale-95"
								title="Edit action"
							>
								<span className="text-sm">✏️</span>
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDelete}
							className="min-w-fit rounded-lg px-2.5 py-1.5 text-red-500 text-xs transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95"
							title="Delete action"
						>
							<span className="text-sm">🗑️</span>
						</Button>
					</div>
				) : (
					<div className="mt-4 ml-2 flex items-center gap-2">
						<Button
							variant="default"
							size="sm"
							onClick={handleSave}
							className="w-20 rounded-md bg-green-600 px-3 py-1 text-white text-xs hover:bg-green-700"
						>
							Save
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancel}
							className="w-20 rounded-md border border-slate-300 bg-white px-3 py-1 text-slate-700 text-xs hover:bg-slate-50"
						>
							Cancel
						</Button>
					</div>
				)}
			</div>

			{/* Selector Section */}
			{action.selector && action.selector.length > 0 && (
				<div className="mb-3">
					<div className="mb-2 font-medium text-slate-500 text-xs">
						Selector
					</div>
					<div
						className={cn(
							"rounded-md px-3 py-2",
							"border border-slate-100 bg-slate-50",
							"font-mono text-slate-700 text-xs",
							"overflow-hidden text-ellipsis whitespace-nowrap",
						)}
						title={action.selector[0]}
					>
						{formatSelector(action.selector)}
					</div>
				</div>
			)}

			{/* Value/Text Section */}
			{(action.text || isEditing) && (
				<div className="mb-3">
					<div className="mb-2 font-medium text-slate-500 text-xs">
						Value
					</div>
					{isEditing ? (
						<input
							type="text"
							value={editedAction.text || ""}
							onChange={(e) =>
								setEditedAction({
									...editedAction,
									text: e.target.value,
								})
							}
							className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-slate-700 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
							placeholder="Text value"
						/>
					) : (
						<div
							className={cn(
								"rounded-md px-3 py-2",
								"border border-slate-100 bg-slate-50",
								"text-slate-700 text-xs",
								"overflow-hidden text-ellipsis whitespace-nowrap",
							)}
							title={action.text}
						>
							{action.text}
						</div>
					)}
				</div>
			)}

			{/* URL Section */}
			{action.url && (
				<div className="mb-3">
					<div className="mb-2 font-medium text-slate-500 text-xs">
						URL
					</div>
					<div
						className={cn(
							"rounded-md px-3 py-2",
							"border border-slate-100 bg-slate-50",
							"text-slate-700 text-xs",
							"overflow-hidden text-ellipsis whitespace-nowrap",
						)}
						title={action.url}
					>
						{action.url}
					</div>
				</div>
			)}

			{/* Scroll Delta (for SCROLL actions) */}
			{action.deltaY !== undefined && (
				<div className="mt-3 border-slate-100 border-t pt-3 text-slate-500 text-xs">
					Scroll: {action.deltaY}px
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			{deleteImpact && (
				<DeleteConfirmationDialog
					isOpen={showDeleteConfirmation}
					onClose={handleCancelDelete}
					onConfirm={handleConfirmDelete}
					impact={deleteImpact}
					stepIndex={index}
					actionType={action.type}
				/>
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
