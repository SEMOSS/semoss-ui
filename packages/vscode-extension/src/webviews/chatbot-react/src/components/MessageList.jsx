import React, { useId } from "react";
import "./MessageList.css";

/**
 * Chat message rendering utilities.
 * Message: renders a single user or bot message with lightweight markdown-ish formatting
 * MessageList: virtual log (simple scroll-to-bottom behavior) + typing indicator support
 */

/**
 * Component for rendering individual chat messages
 */
const Message = ({ message, viewport }) => {
	const { text, from, status, timestamp } = message;
	const { isMobile, isSmallPhone } = viewport;

	const escapeHtml = (text) => {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	};

	const processContent = (text) => {
		if (typeof text !== "string") return String(text);

		let processedContent = escapeHtml(text);

		// Handle code blocks for better mobile display
		const codeBlockRegex = /```([\s\S]*?)```/g;
		processedContent = processedContent.replace(
			codeBlockRegex,
			(_, code) => {
				if (isMobile && isSmallPhone) {
					return `<pre class="code-block small-device-code"><code>${escapeHtml(code.trim())}</code></pre>`;
				} else if (isMobile) {
					return `<pre class="code-block mobile-code"><code>${escapeHtml(code.trim())}</code></pre>`;
				} else {
					return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
				}
			},
		);

		// Handle inline code
		const inlineCodeRegex = /`([^`]+)`/g;
		processedContent = processedContent.replace(
			inlineCodeRegex,
			(_, code) => {
				return `<code class="inline-code">${escapeHtml(code)}</code>`;
			},
		);

		// Convert URLs to responsive clickable links/images
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		processedContent = processedContent.replace(urlRegex, (url) => {
			const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url);

			if (isImage) {
				if (isMobile && isSmallPhone) {
					return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link compact">
                    <div class="image-thumbnail small">
                      <span class="thumbnail-icon">🖼️</span>
                    </div>
                  </a>`;
				} else if (isMobile) {
					return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">
                    <div class="image-thumbnail">
                      <span class="thumbnail-icon">🖼️</span>
                      <span class="thumbnail-text">View Image</span>
                    </div>
                  </a>`;
				} else {
					return `<img src="${url}" alt="Image" class="message-image" loading="lazy" 
                    onerror="this.onerror=null; this.classList.add('image-error');" />`;
				}
			} else {
				const domain = url.replace(/^https?:\/\//, "").split("/")[0];
				const displayText = isSmallPhone
					? domain.split(".")[0] + "..."
					: domain;

				return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link ${isSmallPhone ? "compact" : ""}">
                  ${displayText}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="external-link-icon">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>`;
			}
		});

		// Process lists for better mobile display
		const listRegex = /^([\s]*)[-*+] (.*)/gm;
		processedContent = processedContent.replace(
			listRegex,
			(_, space, item) => {
				const indentLevel = Math.floor(space.length / 2);
				const indentClass =
					indentLevel > 0
						? ` indent-${Math.min(indentLevel, 3)}`
						: "";
				return `<div class="list-item${indentClass}">• ${item}</div>`;
			},
		);

		return processedContent;
	};

	const messageClass = `message ${from}${status ? " " + status : ""}`;
	const bubbleClass = `bubble${text.length > 300 ? " long-text" : ""}`;

	return (
		<li
			className={messageClass}
			aria-label={`${from === "user" ? "You" : "Bot"}: ${typeof text === "string" ? text.replace(/<[^>]*>/g, "") : "Message"}`}
			data-timestamp={new Date(timestamp).toISOString()}
		>
			<div
				className={bubbleClass}
				dangerouslySetInnerHTML={{ __html: processContent(text) }}
			/>
			{status && (
				<span className={`status-indicator ${status}`}>
					{status === "success"
						? "✓"
						: status === "error"
							? "✗"
							: status === "warning"
								? "⚠"
								: "•"}
				</span>
			)}
		</li>
	);
};

/**
 * MessageList component that renders all chat messages
 */
const MessageList = ({ messages, viewport, isLoading }) => {
	const { isMobile, isLandscape } = viewport;
	const chatId = useId();

	React.useEffect(() => {
		// Scroll to bottom when new messages arrive
		const chatElement = document.getElementById(chatId);
		if (chatElement) {
			const scrollBehavior = isMobile || isLandscape ? "auto" : "smooth";
			chatElement.scrollTo({
				top: chatElement.scrollHeight,
				behavior: scrollBehavior,
			});

			// On mobile landscape, ensure content is visible when keyboard appears
			if (isMobile && isLandscape) {
				setTimeout(() => {
					chatElement.scrollTop = chatElement.scrollHeight;
				}, 100);
			}
		}
	}, [messages.length, isMobile, isLandscape, chatId]);

	return (
		<ul
			id={chatId}
			role="log"
			aria-live="polite"
			aria-label="Chat messages"
			className="chat-messages"
		>
			{messages.map((message) => (
				<Message
					key={message.id}
					message={message}
					viewport={viewport}
				/>
			))}
			{isLoading && (
				<li className="message bot loading">
					<div className="bubble">
						<div className="typing-indicator">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</div>
				</li>
			)}
		</ul>
	);
};

export default MessageList;
