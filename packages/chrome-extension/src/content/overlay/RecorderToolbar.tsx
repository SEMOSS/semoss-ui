/**
 * RecorderToolbar Component
 * Floating toolbar displayed during recording with action count and controls
 */

// biome-ignore lint/style/useImportType: the package uses the classic JSX transform.
import React, { useEffect, useState } from "react";
import type { ChromeMessage } from "../../recorder/types";

export const RecorderToolbar: React.FC = () => {
	const [actionCount, setActionCount] = useState(0);
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		// Get initial state
		chrome.runtime
			.sendMessage({ type: "GET_RECORDING_STATE" })
			.then((response) => {
				if (response?.state) {
					console.log("[TOOLBAR] Initial state:", response.state);
					setActionCount(response.state.actionCounter || 0);
					setIsPaused(response.state.isPaused || false);
				}
			})
			.catch((err) =>
				console.error("[TOOLBAR] Failed to get initial state:", err),
			);

		// Listen for state updates from background
		const handleMessage = (message: ChromeMessage) => {
			if (message.type === "STATE_UPDATE" && message.state) {
				console.log("[TOOLBAR] State update received:", message.state);
				setActionCount(message.state.actionCounter || 0);
				setIsPaused(message.state.isPaused || false);
			}
		};

		chrome.runtime.onMessage.addListener(handleMessage);

		return () => {
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, []);

	const handlePause = async () => {
		console.log("[TOOLBAR] Pause clicked");
		try {
			await chrome.runtime.sendMessage({ type: "PAUSE_RECORDING" });
		} catch (err) {
			console.error("[TOOLBAR] Failed to pause:", err);
		}
	};

	const handleResume = async () => {
		console.log("[TOOLBAR] Resume clicked");
		try {
			await chrome.runtime.sendMessage({ type: "RESUME_RECORDING" });
		} catch (err) {
			console.error("[TOOLBAR] Failed to resume:", err);
		}
	};

	const handleStop = async () => {
		console.log("[TOOLBAR] Stop clicked");
		try {
			await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
		} catch (err) {
			console.error("[TOOLBAR] Failed to stop:", err);
		}
	};

	return (
		<div style={styles.container}>
			<div style={styles.toolbar}>
				{/* Recording indicator */}
				<div style={styles.recordingIndicator}>
					<div
						style={{
							...styles.recordingDot,
							...(isPaused ? styles.pausedDot : {}),
						}}
					/>
					<span style={styles.recordingText}>
						{isPaused ? "Paused" : "Recording"}
					</span>
				</div>

				{/* Action count badge */}
				<div style={styles.badge}>
					<span style={styles.badgeText}>{actionCount}</span>
					<span style={styles.badgeLabel}>actions</span>
				</div>

				{/* Controls */}
				<div style={styles.controls}>
					{isPaused ? (
						<button
							type="button"
							onClick={handleResume}
							style={styles.button}
							className="recorder-btn resume-btn"
							title="Resume Recording"
						>
							▶ Resume
						</button>
					) : (
						<button
							type="button"
							onClick={handlePause}
							style={styles.button}
							className="recorder-btn pause-btn"
							title="Pause Recording"
						>
							⏸ Pause
						</button>
					)}

					<button
						type="button"
						onClick={handleStop}
						style={{ ...styles.button, ...styles.stopButton }}
						className="recorder-btn stop-btn"
						title="Stop Recording"
					>
						⏹ Stop
					</button>
				</div>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	container: {
		position: "fixed",
		bottom: "32px",
		left: "50%",
		transform: "translateX(-50%)",
		zIndex: 2147483647,
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	},
	toolbar: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "20px",
		padding: "16px 32px",
		minWidth: "500px",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		borderRadius: "16px",
		boxShadow:
			"0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)",
		backdropFilter: "blur(10px)",
	},
	recordingIndicator: {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		padding: "8px 16px",
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		borderRadius: "8px",
	},
	recordingDot: {
		width: "10px",
		height: "10px",
		borderRadius: "50%",
		backgroundColor: "#ff4444",
		animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
		boxShadow: "0 0 10px rgba(255, 68, 68, 0.8)",
	},
	pausedDot: {
		backgroundColor: "#fbbf24",
		boxShadow: "0 0 10px rgba(251, 191, 36, 0.8)",
		animation: "none",
	},
	recordingText: {
		color: "#ffffff",
		fontSize: "14px",
		fontWeight: 600,
		letterSpacing: "0.5px",
		textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
	},
	badge: {
		display: "flex",
		alignItems: "baseline",
		gap: "6px",
		padding: "8px 20px",
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		borderRadius: "8px",
		border: "1px solid rgba(255, 255, 255, 0.3)",
	},
	badgeText: {
		color: "#ffffff",
		fontSize: "20px",
		fontWeight: 700,
		textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
	},
	badgeLabel: {
		color: "rgba(255, 255, 255, 0.9)",
		fontSize: "12px",
		fontWeight: 500,
		letterSpacing: "0.5px",
	},
	controls: {
		display: "flex",
		gap: "10px",
		paddingLeft: "12px",
		borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
	},
	button: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "6px",
		padding: "10px 20px",
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		border: "1px solid rgba(255, 255, 255, 0.3)",
		borderRadius: "8px",
		color: "#ffffff",
		fontSize: "13px",
		fontWeight: 600,
		cursor: "pointer",
		transition: "all 0.2s ease",
		outline: "none",
		whiteSpace: "nowrap",
		textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
	},
	stopButton: {
		backgroundColor: "rgba(255, 68, 68, 0.3)",
		borderColor: "rgba(255, 68, 68, 0.5)",
	},
};

// Inject keyframe animation and hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }
  
  .recorder-btn:hover {
    background-color: rgba(255, 255, 255, 0.35) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .recorder-btn:active {
    transform: translateY(0px);
  }
  
  .stop-btn:hover {
    background-color: rgba(255, 68, 68, 0.5) !important;
    border-color: rgba(255, 68, 68, 0.7) !important;
  }
`;
document.head.appendChild(styleSheet);
