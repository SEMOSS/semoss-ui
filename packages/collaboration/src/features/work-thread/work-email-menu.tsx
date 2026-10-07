import { Ellipsis } from "lucide-react";
import { useRef } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ThreadMenuItems } from "@/features/collaboration/components/thread-menu-items";
import { useThreadMenuActions } from "@/features/collaboration/components/use-thread-menu-actions";
import { useWorkEmail } from "./work-email.context";

const READER_ACTIONS = new Set(["ask", "draft", "delete", "copy-message"]);

/** Secondary message actions; the reader header already owns reply, forward, and Outlook. */
export function WorkEmailMenu({
	messageId,
	subject,
}: {
	messageId: string;
	subject: string;
}) {
	const { thread, allowedSources } = useWorkEmail();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const movesFocus = useRef(false);
	const groups = useThreadMenuActions({
		thread,
		triggerRef,
		sourceMessageId: messageId,
		isSourceIncluded: allowedSources.has(messageId),
	})
		.map((group) => ({
			id: group.id,
			actions: group.actions.filter((action) =>
				READER_ACTIONS.has(action.id),
			),
		}))
		.filter((group) => group.actions.length > 0);
	return (
		<DropdownMenu
			onOpenChange={(isOpen) => {
				if (isOpen) movesFocus.current = false;
			}}
		>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							ref={triggerRef}
							type="button"
							variant="ghost"
							size="icon-sm"
							className="pointer-coarse:size-11"
							aria-label={`More email actions: ${subject}`}
						>
							<Ellipsis aria-hidden="true" />
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>More email actions</TooltipContent>
			</Tooltip>
			<DropdownMenuContent
				align="end"
				aria-label={`More email actions: ${subject}`}
				onCloseAutoFocus={(event) => {
					if (movesFocus.current) event.preventDefault();
				}}
			>
				<ThreadMenuItems
					groups={groups}
					presentation="dropdown"
					onSelect={(action) => {
						movesFocus.current = Boolean(action.movesFocus);
						action.onSelect();
					}}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
