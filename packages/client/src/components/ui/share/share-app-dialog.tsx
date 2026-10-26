import { ExternalLink, TriangleAlert } from "lucide-react";
import { useRef } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { getAppShareUrl } from "./app-share-url";
import { ShareCopyButton } from "./share-copy-button";

export interface ShareAppDialogProps {
	/** The app to share */
	appId: string;
	/** Whether the dialog is open */
	open: boolean;
	/** Called when the dialog opens or closes */
	onOpenChange: (open: boolean) => void;
	/** Whether the app has changes that are not saved, which the shared app does not have yet */
	hasUnsavedChanges?: boolean;
}

/**
 * Shares an app: a Link tab with the link to the app's shared view, and an
 * Embed tab with the iframe code that shows the app in another page, each
 * with a button to copy it. The dialog opens with the link selected.
 */
export const ShareAppDialog = ({
	appId,
	open,
	onOpenChange,
	hasUnsavedChanges = false,
}: ShareAppDialogProps) => {
	const linkInputRef = useRef<HTMLInputElement>(null);

	const url = getAppShareUrl(appId);
	const embedCode = `<iframe frameborder="0" width="1000" height="600" style="border: 1px solid #ccc;" src="${url}"></iframe>`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				// the dialog never scrolls, so it reserves no scrollbar space,
				// which doubled its side padding where scrollbars always show
				className="[scrollbar-gutter:auto]"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					linkInputRef.current?.focus();
					linkInputRef.current?.select();
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Share App
					</DialogTitle>
					<DialogDescription>
						Send a link to this app, or embed it in another page.
					</DialogDescription>
				</DialogHeader>
				{hasUnsavedChanges ? (
					<Alert className="border-warning/40 bg-warning/10 text-warning">
						<TriangleAlert aria-hidden />
						<AlertDescription className="text-warning/90">
							Save the app first, so the shared app has your
							latest changes.
						</AlertDescription>
					</Alert>
				) : null}
				<Tabs defaultValue="link">
					<TabsList className="w-full">
						<TabsTrigger value="link">Link</TabsTrigger>
						<TabsTrigger value="embed">Embed</TabsTrigger>
					</TabsList>
					<TabsContent
						value="link"
						className="flex items-center gap-2"
					>
						<Input
							ref={linkInputRef}
							value={url}
							readOnly
							aria-label="App link"
							className="min-w-0 flex-1 font-mono text-sm"
						/>
						<ShareCopyButton
							text={url}
							label="Copy link"
							successMessage="Copied the link"
							testId="shareAppDialog-link-copy-btn"
						/>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									asChild
									data-testid="shareAppDialog-link-open-btn"
								>
									<a
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Open the app in a new tab"
									>
										<ExternalLink aria-hidden />
									</a>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Open in a new tab</TooltipContent>
						</Tooltip>
					</TabsContent>
					<TabsContent
						value="embed"
						className="flex items-start gap-2"
					>
						<Textarea
							value={embedCode}
							readOnly
							rows={3}
							aria-label="Embed code"
							className="min-w-0 flex-1 resize-none font-mono text-xs"
						/>
						<ShareCopyButton
							text={embedCode}
							label="Copy embed code"
							successMessage="Copied the embed code"
							testId="shareAppDialog-embed-copy-btn"
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
