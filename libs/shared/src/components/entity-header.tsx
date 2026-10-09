import { Copy, PencilIcon } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { EntityNameInput } from "./entity-name-input";

/** Rename input text per size, matched to the name it replaces. */
const NAME_INPUT_CLASSES = {
	default:
		"h-auto px-2 py-0.5 font-semibold text-2xl leading-tight md:text-[30px]",
	compact:
		"h-auto px-2 py-0.5 font-semibold text-xl leading-tight md:text-2xl",
	sm: "h-6 px-1 py-0 font-medium text-base leading-tight md:text-base",
} as const;

/** A renamable name highlights on hover without moving its text. */
const RENAMABLE_NAME_CLASS =
	"-mx-1 min-w-0 cursor-text rounded-md px-1 hover:bg-muted";

/**
 * The rename button shows on hover or keyboard focus, and always on touch
 * screens, which have no hover.
 */
const RENAME_BUTTON_CLASS =
	"shrink-0 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/name:opacity-100 pointer-coarse:opacity-100";

interface EntityHeaderProps {
	/** Rendered icon, placed inside a sized wrapper. Omit for no-icon headers. */
	icon?: ReactNode;
	/** Entity display name shown as the title. */
	name: string;
	/** Entity id shown as a muted line below the name. Optional copy button. */
	id?: string;
	/**
	 * Visual density:
	 * - "default": page-level header (text-2xl, 64x64 icon).
	 * - "compact": tighter page header (text-xl, 48x48 icon).
	 * - "sm": modal/inline header (text-base, 24x24 icon, always single-line + truncate).
	 */
	size?: "default" | "compact" | "sm";
	/** Show the inline copy-id button next to the id. Default: true when id is present. */
	copyable?: boolean;
	/** Tooltip text + button aria-label for the copy action. Default: "Copy ID". */
	copyLabel?: string;
	/** Right-aligned action buttons (edit, export, admin toggle, etc.). */
	actions?: ReactNode;
	/** Optional data-testid for the name element. */
	nameTestId?: string;
	/** Optional data-testid for the id span. */
	idTestId?: string;
	/** Optional data-testid for the copy button. */
	copyTestId?: string;
	/**
	 * Saves a new name; reject to report a failure. When set, a rename button
	 * sits beside the name, and double-clicking the name also starts a rename.
	 * Enter or leaving the input saves, Escape cancels, and a toast reports
	 * the result.
	 */
	onRename?: (name: string) => Promise<void>;
	/** Tooltip and accessible name for the rename button and input. Default: "Rename". */
	renameLabel?: string;
	/** Shown right after the name, such as a type badge or icon buttons that act on the entity. */
	nameAddon?: ReactNode;
	/** Shown below the name and id, such as the entity's description. */
	description?: ReactNode;
}

export const EntityHeader = ({
	icon,
	name,
	id,
	size = "default",
	copyable = true,
	copyLabel = "Copy ID",
	actions,
	nameTestId,
	idTestId,
	copyTestId,
	onRename,
	renameLabel = "Rename",
	nameAddon,
	description,
}: EntityHeaderProps) => {
	const [isRenaming, setIsRenaming] = useState(false);
	// set when a rename ends from the keyboard, so focus returns to the button
	const shouldFocusRenameRef = useRef(false);

	const handleCopy = () => {
		if (!id) return;
		try {
			navigator.clipboard.writeText(id);
			toast.success("ID copied to clipboard");
		} catch (e) {
			console.error(e);
			toast.error("Failed to copy ID");
		}
	};

	const isSm = size === "sm";
	const isCompact = size === "compact";

	// Wrapper layout: "sm" stays horizontal at every viewport (modal use-case);
	// "default" / "compact" stack on mobile and lay out as a row on md+.
	const wrapperClass = isSm
		? "flex w-full flex-row items-center gap-3"
		: `flex w-full flex-col ${
				isCompact ? "gap-3" : "gap-4"
			} md:flex-row md:items-center`;

	const iconWrapperSize = isSm
		? "size-6"
		: isCompact
			? "h-12 w-12"
			: "h-16 w-16";

	// "sm" truncates at every viewport. The larger sizes break-words on mobile
	// and switch to single-line + ellipsis at md+ to preserve the pre-existing
	// page-header behavior on small screens.
	const nameClass = isSm
		? "min-w-0 truncate font-medium text-base text-foreground leading-tight"
		: isCompact
			? "break-words font-semibold text-foreground text-xl leading-tight md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-2xl"
			: "break-words font-semibold text-2xl text-foreground leading-tight md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-[30px]";

	/**
	 * Close the rename input, returning focus to the rename button when asked
	 */
	const handleRenameDone = (restoreFocus: boolean) => {
		shouldFocusRenameRef.current = restoreFocus;
		setIsRenaming(false);
	};

	const nameElementProps = {
		// a name with something after it shrinks so the row can truncate it
		className: cn(
			nameClass,
			onRename && RENAMABLE_NAME_CLASS,
			nameAddon && "min-w-0",
		),
		"data-testid": nameTestId,
		onDoubleClick: onRename ? () => setIsRenaming(true) : undefined,
	};
	const nameElement = isSm ? (
		<span {...nameElementProps}>{name}</span>
	) : (
		<h1 {...nameElementProps}>{name}</h1>
	);

	const idClass = isSm
		? "min-w-0 truncate text-muted-foreground text-xs"
		: isCompact
			? "text-muted-foreground text-xs"
			: "text-muted-foreground text-sm";

	/** The name, the rename input, or the name with its rename button */
	const renderName = (): ReactNode =>
		isRenaming && onRename ? (
			<EntityNameInput
				name={name}
				label={renameLabel}
				className={NAME_INPUT_CLASSES[size]}
				onRename={onRename}
				onDone={handleRenameDone}
			/>
		) : onRename ? (
			<div className="group/name flex min-w-0 items-center gap-1">
				{nameElement}
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							ref={(element) => {
								if (element && shouldFocusRenameRef.current) {
									shouldFocusRenameRef.current = false;
									element.focus();
								}
							}}
							variant="ghost"
							size="icon-sm"
							aria-label={renameLabel}
							onClick={() => setIsRenaming(true)}
							className={cn(
								RENAME_BUTTON_CLASS,
								isSm && "size-6",
							)}
						>
							<PencilIcon
								className={isSm ? "size-3" : "size-4"}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>{renameLabel}</TooltipContent>
				</Tooltip>
			</div>
		) : (
			nameElement
		);

	return (
		<div className={wrapperClass}>
			{icon && (
				<div
					className={`flex shrink-0 items-center justify-center overflow-hidden bg-transparent ${iconWrapperSize}`}
				>
					{icon}
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				{nameAddon ? (
					<div className="flex min-w-0 flex-wrap items-center gap-2">
						{renderName()}
						{nameAddon}
					</div>
				) : (
					renderName()
				)}
				{id && (
					<div
						className={`flex flex-row items-center ${isSm ? "min-w-0 gap-0.5" : "gap-1"}`}
					>
						<span
							className={idClass}
							data-testid={idTestId}
							title={isSm ? id : undefined}
						>
							{id}
						</span>
						{copyable && (
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size={isSm ? "icon-sm" : "icon-sm"}
										aria-label={copyLabel}
										onClick={handleCopy}
										data-testid={copyTestId}
										className={isSm ? "size-5" : undefined}
									>
										<Copy
											className={
												isSm ? "size-3" : "size-4"
											}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>{copyLabel}</TooltipContent>
							</Tooltip>
						)}
					</div>
				)}
				{description ? <div className="mt-1">{description}</div> : null}
			</div>

			{actions && (
				<div
					className={
						isSm
							? "flex shrink-0 items-center gap-1"
							: "flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end"
					}
				>
					{actions}
				</div>
			)}
		</div>
	);
};
