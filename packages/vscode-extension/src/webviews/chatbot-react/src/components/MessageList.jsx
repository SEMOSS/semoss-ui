import React, { useId, useRef } from "react";
import "./MessageList.css";

/**
 * Chat message rendering utilities.
 * Message: renders a single user or bot message with lightweight markdown-ish formatting
 * MessageList: virtual log (simple scroll-to-bottom behavior) + typing indicator support
 */

/**
 * Component for rendering individual chat messages
 */
const Message = ({ message, viewport, onToolClick }) => {
	const { text, from, status, timestamp, tools } = message;
	const { isMobile, isSmallPhone } = viewport;

	// (Removed escapeHtml utility – constructing React nodes avoids raw HTML injection.)

	// Convert raw message text into a safe React node structure (no innerHTML)
	const renderContent = (raw) => {
		if (typeof raw !== "string") return <>{String(raw)}</>;

		// Tokenize code blocks first
		const codeBlockRegex = /```([\s\S]*?)```/g;
		const segments = [];
		let lastIndex = 0;
		let match;
		// Extract fenced code blocks
		match = codeBlockRegex.exec(raw);
		while (match !== null) {
			if (match.index > lastIndex) {
				segments.push({
					type: "text",
					value: raw.slice(lastIndex, match.index),
				});
			}
			segments.push({ type: "codeblock", value: match[1] });
			lastIndex = match.index + match[0].length;
			match = codeBlockRegex.exec(raw);
		}
		if (lastIndex < raw.length) {
			segments.push({ type: "text", value: raw.slice(lastIndex) });
		}

		const elements = [];
		let key = 0;

		const makeCodeBlock = (code) => {
			const trimmed = code.trim();
			const cls = isMobile
				? isSmallPhone
					? "code-block small-device-code"
					: "code-block mobile-code"
				: "code-block";
			return (
				<pre key={`cb-${key++}`} className={cls}>
					<code>{trimmed}</code>
				</pre>
			);
		};

		const processInline = (textSeg) => {
			// Split into lines to handle list formatting
			const lines = textSeg.split(/\n/);
			return lines.map((line, lineIdx) => {
				// List item detection
				const listMatch = /^([\s]*)[-*+] (.*)/.exec(line);
				if (listMatch) {
					const space = listMatch[1];
					const item = listMatch[2];
					const indentLevel = Math.floor(space.length / 2);
					const indentClass =
						indentLevel > 0
							? ` indent-${Math.min(indentLevel, 3)}`
							: "";
					return (
						<div
							key={`li-${key++}`}
							className={`list-item${indentClass}`}
						>
							{renderInlineSpans(item)}
						</div>
					);
				}
				// Normal line => inline spans (may include links, inline code)
				const content = renderInlineSpans(line);
				// Preserve blank lines
				if (line.trim() === "") {
					return <br key={`br-${key++}`} />;
				}
				return (
					<React.Fragment key={`ln-${key++}`}>
						{content}
						{lineIdx < lines.length - 1 && <br />}
					</React.Fragment>
				);
			});
		};

		const renderInlineSpans = (value) => {
			const parts = [];
			const remaining = value;
			// Order: inline code then URLs
			const inlineCodeRegex = /`([^`]+)`/g;
			let idx = 0;
			let m;
			m = inlineCodeRegex.exec(remaining);
			while (m !== null) {
				const before = remaining.slice(idx, m.index);
				if (before) parts.push(before);
				parts.push(
					<code key={`ic-${key++}`} className="inline-code">
						{m[1]}
					</code>,
				);
				idx = m.index + m[0].length;
				m = inlineCodeRegex.exec(remaining);
			}
			if (idx < remaining.length) parts.push(remaining.slice(idx));

			// Now process URLs inside string segments only
			const urlRegex = /(https?:\/\/[^\s]+)/g;
			const finalParts = [];
			parts.forEach((p) => {
				if (typeof p !== "string") {
					finalParts.push(p); // already element
					return;
				}
				let last = 0;
				let urlMatch = urlRegex.exec(p);
				while (urlMatch !== null) {
					if (urlMatch.index > last)
						finalParts.push(p.slice(last, urlMatch.index));
					const url = urlMatch[0];
					const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url);
					if (isImage) {
						if (isMobile) {
							if (isSmallPhone) {
								finalParts.push(
									<a
										key={`imglnk-${key++}`}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="message-link compact"
									>
										<div className="image-thumbnail small">
											<span
												className="thumbnail-icon"
												role="img"
												aria-label="Image"
											>
												🖼️
											</span>
										</div>
									</a>,
								);
							} else {
								finalParts.push(
									<a
										key={`imglnk-${key++}`}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="message-link"
									>
										<div className="image-thumbnail">
											<span
												className="thumbnail-icon"
												role="img"
												aria-label="Image"
											>
												🖼️
											</span>
											<span className="thumbnail-text">
												View Image
											</span>
										</div>
									</a>,
								);
							}
						} else {
							finalParts.push(
								<img
									key={`img-${key++}`}
									src={url}
									alt="Attached media"
									className="message-image"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.classList.add(
											"image-error",
										);
									}}
								/>,
							);
						}
					} else {
						const domain = url
							.replace(/^https?:\/\//, "")
							.split("/")[0];
						const displayText = isSmallPhone
							? `${domain.split(".")[0]}...`
							: domain;
						finalParts.push(
							<a
								key={`lnk-${key++}`}
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								className={`message-link ${isSmallPhone ? "compact" : ""}`}
							>
								{displayText}
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									className="external-link-icon"
									aria-hidden="true"
								>
									<path
										d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</a>,
						);
					}
					last = urlMatch.index + url.length;
					urlMatch = urlRegex.exec(p);
				}
				if (last < p.length) finalParts.push(p.slice(last));
			});
			return finalParts;
		};

		segments.forEach((seg) => {
			if (seg.type === "codeblock") {
				elements.push(makeCodeBlock(seg.value));
			} else {
				elements.push(...processInline(seg.value));
			}
		});

		return <>{elements}</>;
	};

	const messageClass = `message ${from}${status ? ` ${status}` : ""}`;
	const bubbleClass = `bubble${text.length > 300 ? " long-text" : ""}`;

	const isTools = Array.isArray(tools) && status === "tools";

	return (
		<li
			className={messageClass + (isTools ? " tools-message" : "")}
			aria-label={`${from === "user" ? "You" : "Bot"}: ${typeof text === "string" ? text.replace(/<[^>]*>/g, "") : "Message"}`}
			data-timestamp={new Date(timestamp).toISOString()}
		>
			<div className={bubbleClass}>
				<div>{renderContent(text)}</div>
				{isTools && (
					<div className="tools-button-group">
						{tools.map((tool) => (
							<button
								key={tool.command}
								type="button"
								className="tool-inline-btn"
								onClick={() => onToolClick?.(tool)}
								title={tool.label}
							>
								<span className="tool-icon" aria-hidden="true">
									{tool.icon || "🔧"}
								</span>
								<span className="tool-label">{tool.label}</span>
							</button>
						))}
					</div>
				)}
			</div>
			{status && status !== "tools" && (
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
const MessageList = ({ messages, viewport, isLoading, onToolClick }) => {
	const { isMobile, isLandscape } = viewport;
	const chatId = useId();

	const prevCountRef = useRef(messages.length);
	React.useEffect(() => {
		const newCount = messages.length;
		if (newCount === prevCountRef.current) return; // Only react to count change
		prevCountRef.current = newCount;
		const chatElement = document.getElementById(chatId);
		if (!chatElement) return;
		const scrollBehavior = isMobile || isLandscape ? "auto" : "smooth";
		chatElement.scrollTo({
			top: chatElement.scrollHeight,
			behavior: scrollBehavior,
		});
		if (isMobile && isLandscape) {
			setTimeout(() => {
				chatElement.scrollTop = chatElement.scrollHeight;
			}, 100);
		}
	}, [messages, isMobile, isLandscape, chatId]);

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
					onToolClick={onToolClick}
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
