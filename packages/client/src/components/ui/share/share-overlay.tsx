import { Check, Copy, TriangleAlert } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { resolvePath } from "react-router-dom";
import {
	Button,
	DialogDescription,
	DialogTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";

interface ShareOverlayProps {
	appId: string;
	onClose: () => void;
	diffs?: boolean;
}

const CopyButton = ({
	text,
	label = "Copy",
}: {
	text: string;
	label?: string;
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		try {
			navigator.clipboard.writeText(text);
			toast.success("Copied to clipboard");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to copy");
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleCopy}
			className="shrink-0"
		>
			{copied ? (
				<>
					<Check className="mr-1.5 size-3.5" />
					Copied
				</>
			) : (
				<>
					<Copy className="mr-1.5 size-3.5" />
					{label}
				</>
			)}
		</Button>
	);
};

export const ShareOverlay = observer((props: ShareOverlayProps) => {
	const { appId, diffs, onClose = () => null } = props;

	const base = window.location.href.replace(window.location.hash, "#");
	const path = resolvePath(`./s/${appId}`, base);
	const url = path.pathname;
	const iframe = `<iframe frameborder="0" width="1000" height="600" style="border: 1px solid #ccc;" src="${url}"></iframe>`;

	return (
		<div className="flex w-full min-w-0 flex-col">
			{/* Header */}
			<div className="border-b px-6 py-4">
				<DialogTitle className="font-semibold text-lg leading-none">
					Share
				</DialogTitle>
				<DialogDescription className="sr-only">
					Share this app via a direct URL or embed it in another page
					using an iframe.
				</DialogDescription>
			</div>

			{/* Body */}
			<div className="flex min-w-0 flex-col gap-4 px-6 py-5">
				{diffs && (
					<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
						<TriangleAlert className="mt-0.5 size-4 shrink-0" />
						<span>
							Save the app before sharing to reflect the latest
							changes
						</span>
					</div>
				)}

				<Tabs defaultValue="url" className="w-full">
					<TabsList className="w-full">
						<TabsTrigger value="url" className="flex-1">
							URL
						</TabsTrigger>
						<TabsTrigger value="iframe" className="flex-1">
							IFrame
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="url"
						className="flex min-w-0 flex-col gap-2 pt-3"
					>
						<p className="text-muted-foreground text-xs">
							Share a direct link to this app
						</p>
						<div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
							<span className="min-w-0 flex-1 truncate font-mono text-sm">
								{url}
							</span>
							<CopyButton text={url} />
						</div>
					</TabsContent>

					<TabsContent
						value="iframe"
						className="flex min-w-0 flex-col gap-2 pt-3"
					>
						<p className="text-muted-foreground text-xs">
							Embed this app in another page using an iframe
						</p>
						<div className="rounded-md border bg-muted/40 p-3">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-mono text-muted-foreground text-xs">
									HTML
								</span>
								<CopyButton text={iframe} label="Copy code" />
							</div>
							<pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed">
								{iframe}
							</pre>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* Footer */}
			<div className="flex justify-end border-t px-6 py-4">
				<Button variant="ghost" onClick={onClose}>
					Close
				</Button>
			</div>
		</div>
	);
});
