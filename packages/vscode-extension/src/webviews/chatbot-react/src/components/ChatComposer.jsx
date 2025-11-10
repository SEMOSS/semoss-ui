import { useRef, useState } from "react";
import ModelSelector from "./ModelSelector";
import "./ChatComposer.css";

// Simple icon components
const SendIcon = () => (
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M22 2 11 13" />
		<path d="M22 2 15 22 11 13 2 9Z" />
	</svg>
);

/**
 * ChatComposer replicates the screenshot style: multi-line textarea with placeholder, toolbar row with agent + model selectors and actions.
 */
const ToolsIcon = () => (
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M14.7 6.3a1 1 0 0 0 1.4 0l1.6-1.6a4 4 0 0 1 5.4 5.4L21.5 12a1 1 0 0 0 0 1.4l2.1 2.1a1 1 0 0 1 0 1.4l-3.2 3.2a1 1 0 0 1-1.4 0l-2.1-2.1a1 1 0 0 0-1.4 0l-1.5 1.5a1 1 0 0 1-1.4 0L8 14.4a1 1 0 0 1 0-1.4l1.5-1.5a1 1 0 0 0 0-1.4L6.9 6.9a1 1 0 0 1 0-1.4l3.2-3.2a1 1 0 0 1 1.4 0Z" />
	</svg>
);

const ChatComposer = ({
	onSend,
	disabled = false,
	isLoading = false,
	onModelChange,
	onToolsClick,
}) => {
	const [text, setText] = useState("");
	const textareaRef = useRef(null);

	const resizeTextarea = () => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
	};

	const handleSend = () => {
		if (!text.trim() || disabled || isLoading) return;
		if (onSend) onSend(text.trim());
		setText("");
		// Reset height after clearing
		requestAnimationFrame(resizeTextarea);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="chat-composer">
			<div className="chat-composer-textarea-wrapper">
				{!text && (
					<div className="chat-composer-placeholder">
						Enter your prompt
					</div>
				)}
				<textarea
					ref={textareaRef}
					className="chat-composer-textarea"
					value={text}
					onChange={(e) => {
						setText(e.target.value);
						resizeTextarea();
					}}
					onKeyDown={handleKeyDown}
					onFocus={resizeTextarea}
					rows={1}
					disabled={disabled || isLoading}
				/>
			</div>
			<div className="chat-composer-toolbar">
				<ModelSelector onChange={onModelChange} />
				<div className="chat-composer-send">
					<button
						type="button"
						className="chat-icon-btn"
						onClick={() => onToolsClick?.()}
						title="Semoss App Actions"
						aria-label="Show tools"
					>
						<ToolsIcon />
					</button>
					<button
						type="button"
						className="chat-icon-btn"
						onClick={handleSend}
						disabled={!text.trim() || disabled || isLoading}
						title="Send"
					>
						<SendIcon />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ChatComposer;
