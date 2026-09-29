import { ImageOff } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, P } from "@semoss/ui/next";
import { emailDocument } from "./email-html";

/** Isolates source HTML and observes layout without permitting scripts in the email. */
export function EmailBody({
	html,
	title,
	presentation = "inline",
}: {
	html: string;
	title: string;
	presentation?: "inline" | "reader";
}) {
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
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
					<ImageOff
						className="size-4 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<P className="min-w-0 flex-1 basis-40 text-muted-foreground text-sm">
						Remote images are hidden.
					</P>
					<Button
						type="button"
						size="sm"
						className="min-h-11 sm:min-h-8"
						variant="outline"
						onClick={() => setLoadImages(true)}
					>
						Load images
					</Button>
				</div>
			)}
			<iframe
				ref={frame}
				id={id}
				title={title}
				srcDoc={source.html}
				sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				referrerPolicy="no-referrer"
				className={
					presentation === "reader"
						? "block w-full border-0"
						: "block w-full rounded-lg border border-border"
				}
				style={{
					height:
						presentation === "reader" || isExpanded
							? Math.min(height, 20000)
							: Math.min(height, 288),
				}}
			/>
			{presentation === "inline" && height > 288 && (
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
