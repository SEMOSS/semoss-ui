import ChatComposer from "./ChatComposer";
// File: OptionsPanel.jsx
// Purpose: Provides the selectable action/instance option UI, start screen and chat composer wrapper.
// Components exported:
//  - OptionButton: generic button with selected/disabled styling.
//  - BackButton: navigational control for returning to previous menu state.
//  - StartArea: initial welcome panel before chat starts.
//  - OptionsPanel: grid/list of actionable options.
//  - InteractionArea: orchestrates which panel (start/options/chat input) is shown.
// import ChatInput from './ChatInput';
import "./OptionsPanel.css";

/**
 * Individual option button component
 */
const OptionButton = ({ option, onClick, isSelected }) => {
	const { label, icon, disabled } = option;

	const buttonClass = `option-btn${isSelected ? " selected-instance" : ""}${disabled ? " disabled" : ""}`;

	return (
		<button
			type="button"
			className={buttonClass}
			onClick={() => !disabled && onClick(option)}
			disabled={disabled}
			aria-label={`${label}${isSelected ? " (currently selected)" : ""}`}
		>
			{icon && (
				<span className="option-icon" aria-hidden="true">
					{icon}
				</span>
			)}
			<span className="option-label">{label}</span>
		</button>
	);
};

/**
 * Back button component
 */
const BackButton = ({ onClick, label = "Back" }) => (
	<button
		type="button"
		className="option-btn back-btn"
		onClick={onClick}
		aria-label={label}
	>
		<span className="option-icon" aria-hidden="true">
			←
		</span>
		<span className="option-label">{label}</span>
	</button>
);

/**
 * Start area component for initial chat state
 */
const StartArea = ({ onStart }) => {
	return (
		<div className="start-area">
			<div className="welcome-content">
				<h2>Welcome to Semoss Assistant</h2>
				<p>
					I can help you with zipping, deploying, and managing your
					Semoss applications.
				</p>
				<button
					className="start-btn"
					type="button"
					onClick={onStart}
					aria-label="Start chatting with Semoss Assistant"
				>
					Get Started
				</button>
			</div>
		</div>
	);
};

/**
 * Options panel component for displaying action buttons
 */
const OptionsPanel = ({
	options = [],
	onOptionClick,
	onBack,
	showBack = false,
	backLabel = "Back",
	viewport,
	currentInstance,
	instanceUrls = {},
	isVisible = true,
	isLoading = false,
}) => {
	if (!isVisible || options.length === 0) {
		return null;
	}

	const { isMobile } = viewport;
	const gridClass = options.length > 1 ? "options-grid" : "";

	// Adjust options layout for viewport
	const adjustedClass = `options-area ${gridClass}${isMobile ? " mobile-options" : ""}`;

	const enhancedOptions = options.map((option) => {
		// Enhance option with URL info if it's an instance
		if (option.isInstance && instanceUrls[option.command]) {
			return {
				...option,
				label: `${option.label} (${instanceUrls[option.command]})`,
				isSelected: currentInstance === option.command,
			};
		}
		return { ...option, disabled: isLoading || option.disabled };
	});

	return (
		<fieldset className={adjustedClass} aria-label="Available actions">
			<legend className="visually-hidden">Available actions</legend>
			{enhancedOptions.map((option, index) => (
				<OptionButton
					key={option.command || option.id || index}
					option={option}
					onClick={onOptionClick}
					isSelected={option.isSelected}
					viewport={viewport}
				/>
			))}
			{showBack && <BackButton onClick={onBack} label={backLabel} />}
		</fieldset>
	);
};

/**
 * Main container for start area and options
 */
const InteractionArea = ({
	chatStarted,
	showOptions,
	options,
	onStart,
	onOptionClick,
	onSendMessage,
	onBack,
	showBack,
	backLabel,
	viewport,
	currentInstance,
	instanceUrls,
	onModelChange,
	onToolsClick,
}) => {
	if (!chatStarted) {
		return <StartArea onStart={onStart} viewport={viewport} />;
	}

	if (showOptions) {
		return (
			<>
				<OptionsPanel
					options={options}
					onOptionClick={onOptionClick}
					onBack={onBack}
					showBack={showBack}
					backLabel={backLabel}
					viewport={viewport}
					currentInstance={currentInstance}
					instanceUrls={instanceUrls}
					isLoading={false}
				/>
				<div
					style={{
						padding: "8px",
						borderTop: "1px solid #3c3c3c",
					}}
				>
					<ChatComposer
						onSend={onSendMessage}
						onModelChange={onModelChange}
						onToolsClick={onToolsClick}
					/>
				</div>
			</>
		);
	}

	// Show chat input when chat has started but no options are shown
	return onSendMessage ? (
		<div style={{ padding: "8px", borderTop: "1px solid #3c3c3c" }}>
			<ChatComposer
				onSend={onSendMessage}
				onModelChange={onModelChange}
				onToolsClick={onToolsClick}
			/>
		</div>
	) : null;
};

export default InteractionArea;
export { OptionsPanel, StartArea, OptionButton, BackButton };
