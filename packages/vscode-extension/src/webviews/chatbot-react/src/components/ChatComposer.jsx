import { useEffect, useRef, useState } from "react";
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
const ChatComposer = ({
	onSend,
	disabled = false,
	isLoading = false,
	onModelChange,
}) => {
	const [text, setText] = useState("");
	const textareaRef = useRef(null);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				120,
			)}px`;
		}
		// biome rule suggested removing dependency; effect logically depends on text to resize
	}, [text]);

	const handleSend = () => {
		if (!text.trim() || disabled || isLoading) return;
		if (onSend) onSend(text.trim());
		setText("");
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
					onChange={(e) => setText(e.target.value)}
					onKeyDown={handleKeyDown}
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
