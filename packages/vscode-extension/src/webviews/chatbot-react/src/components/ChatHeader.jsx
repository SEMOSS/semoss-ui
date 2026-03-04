// React import not needed for JSX in modern setups
import "./ChatHeader.css";

/**
 * Header button component
 */
const HeaderButton = ({
	onClick,
	title,
	ariaLabel,
	children,
	className = "",
}) => (
	<button
		type="button"
		className={`header-btn ${className}`}
		onClick={onClick}
		title={title}
		aria-label={ariaLabel}
	>
		{children}
	</button>
);

/**
 * Download icon SVG
 */
const DownloadIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Download user manual"
	>
		<title>Download user manual</title>
		<path
			d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Clear icon SVG
 */
const ClearIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Clear chat history"
	>
		<title>Clear chat history</title>
		<path
			d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Settings icon SVG
 */
const SettingsIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Open settings"
	>
		<title>Open settings</title>
		<path
			d="M12 15a3 3 0 100-6 3 3 0 000 6z"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Chat header component
 */
const ChatHeader = ({
	title = "Chat",
	onClear,
	onDownloadManual,
	onSettings,
	isVisible = true,
	hasMessages = false,
}) => {
	if (!isVisible) {
		return null;
	}

	return (
		<header className="chat-header">
			<span className="chat-title">{title}</span>

			<div className="header-buttons">
				{onSettings && (
					<HeaderButton
						onClick={onSettings}
						title="Open Settings"
						ariaLabel="Open Settings"
					>
						<SettingsIcon />
					</HeaderButton>
				)}

				<HeaderButton
					onClick={onDownloadManual}
					title="Download User Manual"
					ariaLabel="Download User Manual"
				>
					<DownloadIcon />
				</HeaderButton>

				{hasMessages && (
					<HeaderButton
						onClick={onClear}
						title="Clear chat history"
						ariaLabel="Clear chat history"
					>
						<ClearIcon />
					</HeaderButton>
				)}
			</div>
		</header>
	);
};

export default ChatHeader;
