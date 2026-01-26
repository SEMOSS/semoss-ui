import { useEffect, useRef, useState } from "react";
import "./ChatInput.css";

/**
 * Chat input component for sending messages to LLM
 */
const ChatInput = ({
	onSendMessage,
	isLoading,
	disabled = false,
	placeholder = "Type your message...",
}) => {
	const [message, setMessage] = useState("");
	const textareaRef = useRef(null);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (message.trim() && !isLoading && !disabled) {
			onSendMessage(message.trim());
			setMessage("");
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			const scrollHeight = textarea.scrollHeight;
			const maxHeight = 120; // Max 4-5 lines
			textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
		}
	}); // Runs each render; height adjusts when message state changes

	return (
		<div className="chat-input-container">
			<form onSubmit={handleSubmit} className="chat-input-form">
				<div className="input-wrapper">
					<textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={disabled || isLoading}
						className="chat-input"
						rows={1}
						maxLength={4000}
					/>
					<button
						type="submit"
						disabled={!message.trim() || isLoading || disabled}
						className="send-button"
						aria-label="Send message"
					>
						{isLoading ? (
							<span className="loading-spinner">⟳</span>
						) : (
							<span className="send-icon">→</span>
						)}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ChatInput;
