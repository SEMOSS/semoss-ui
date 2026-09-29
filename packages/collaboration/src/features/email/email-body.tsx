import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { emailDocument } from "./email-html";

/** Isolates source HTML and observes layout without permitting scripts in the email. */
export function EmailBody({ html, title }: { html: string; title: string }) {
	const [loadImages, setLoadImages] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [height, setHeight] = useState(160);
	const frame = useRef<HTMLIFrameElement>(null);
	const id = useId();
	const source = useMemo(
		() => emailDocument(html, loadImages),
		[html, loadImages],
	);
	useEffect(() => {
		const element = frame.current;
		if (!element) return;
		let observer: ResizeObserver | undefined;
		const measure = () => {
			const body = element.contentDocument?.body;
			if (body)
				setHeight(
					Math.max(
						80,
						Math.ceil(body.getBoundingClientRect().height),
					),
				);
		};
		const loaded = () => {
			observer?.disconnect();
			const body = element.contentDocument?.body;
			if (!body) return;
			observer = new ResizeObserver(measure);
			observer.observe(body);
			measure();
		};
		element.addEventListener("load", loaded);
		loaded();
		return () => {
			element.removeEventListener("load", loaded);
			observer?.disconnect();
		};
	}, []);
	return (
		<div className="min-w-0 space-y-2">
			{source.hasImages && !loadImages && (
				<Button
					type="button"
					size="sm"
					className="min-h-11 sm:min-h-8"
					variant="outline"
					onClick={() => setLoadImages(true)}
				>
					Load images
				</Button>
			)}
			<iframe
				ref={frame}
				id={id}
				title={title}
				srcDoc={source.html}
				sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				referrerPolicy="no-referrer"
				className="w-full rounded-md border"
				style={{
					height: isExpanded
						? Math.min(height, 20000)
						: Math.min(height, 288),
				}}
			/>
			{height > 288 && (
				<Button
					type="button"
					size="sm"
					className="min-h-11 sm:min-h-8"
					variant="ghost"
					aria-expanded={isExpanded}
					aria-controls={id}
					onClick={() => setIsExpanded((value) => !value)}
				>
					{isExpanded ? "Show less" : "Show full email"}
				</Button>
			)}
		</div>
	);
}
