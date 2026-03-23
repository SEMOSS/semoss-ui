import { Avatar, AvatarFallback, P } from "@semoss/ui/next";
import { extractInitials } from "@/utility/general";

interface MembersAddOverlayUserProps {
	/**
	 * Name of the user
	 */
	name: string;

	/**
	 * Name of the user
	 */
	id: string;

	/**
	 * Email of the user
	 */
	email: string;

	/**
	 * Type of the user
	 */
	type: string;

	/**
	 * Optional action to render
	 */
	action?: React.ReactNode;
}

export const MembersAddOverlayUser = (props: MembersAddOverlayUserProps) => {
	const { name, id, email, type, action } = props;

	const initials = extractInitials(name);

	return (
		<div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2">
			<Avatar className="h-8 w-8">
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div className="flex min-w-0 flex-col gap-0.5">
				<P className="truncate text-foreground" title={name}>
					{name || <>&nbsp;</>}
				</P>
				<div className="flex flex-col gap-0 text-sm">
					<div className="flex min-w-0 gap-1" title={`ID: ${id}`}>
						<span className="shrink-0 text-muted-foreground">
							ID:
						</span>
						<span className="truncate text-foreground">
							{id || "—"}
						</span>
					</div>
					<div
						className="flex min-w-0 gap-1"
						title={`Email: ${email}`}
					>
						<span className="shrink-0 text-muted-foreground">
							Email:
						</span>
						<span className="truncate text-foreground">
							{email || "—"}
						</span>
					</div>
					<div className="flex min-w-0 gap-1" title={`Type: ${type}`}>
						<span className="shrink-0 text-muted-foreground">
							Type:
						</span>
						<span className="truncate text-foreground">
							{type || "—"}
						</span>
					</div>
				</div>
			</div>
			{action}
		</div>
	);
};
