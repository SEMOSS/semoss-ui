import { Copy, ExternalLink } from "lucide-react";
import { useId } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";

export interface SettingsLinkFieldProps {
	/** The link's name, such as "Share Link" */
	label: string;
	/** What the link opens, shown under it */
	description: string;
	/** The link, or an empty string when there is none yet */
	url: string;
	/** Shown in the field while there is no link */
	emptyText?: string;
	/** Prefix for the buttons' data-testid, such as "appPortal-share" */
	testIdPrefix: string;
}

/**
 * A read-only link in a Settings section, with buttons to copy it and to open
 * it in a new tab. Both are disabled while there is no link.
 */
export const SettingsLinkField = ({
	label,
	description,
	url,
	emptyText = "",
	testIdPrefix,
}: SettingsLinkFieldProps) => {
	const id = useId();
	const descriptionId = `${id}-description`;
	const hasUrl = url.length > 0;

	const handleCopy = () =>
		copyTextToClipboard(url, {
			onSuccess: () => toast.success(`Copied the ${label.toLowerCase()}`),
			onError: (message) => toast.error(message),
		});

	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="flex items-center gap-2">
				<Input
					id={id}
					value={url}
					placeholder={emptyText}
					readOnly
					aria-describedby={descriptionId}
					className="min-w-0 flex-1 font-mono text-sm"
				/>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label={`Copy ${label}`}
							disabled={!hasUrl}
							onClick={handleCopy}
							data-testid={`${testIdPrefix}-copy-btn`}
						>
							<Copy aria-hidden />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Copy</TooltipContent>
				</Tooltip>
				{hasUrl ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								asChild
								data-testid={`${testIdPrefix}-open-btn`}
							>
								<a
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Open ${label} in a new tab`}
								>
									<ExternalLink aria-hidden />
								</a>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Open in a new tab</TooltipContent>
					</Tooltip>
				) : (
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label={`Open ${label} in a new tab`}
						disabled
						data-testid={`${testIdPrefix}-open-btn`}
					>
						<ExternalLink aria-hidden />
					</Button>
				)}
			</div>
			<FieldDescription id={descriptionId}>
				{description}
			</FieldDescription>
		</Field>
	);
};
