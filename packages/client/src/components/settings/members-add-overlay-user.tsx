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
			<div className="flex min-w-0 flex-col gap-0">
				<P
					className="max-w-[150px] truncate text-foreground"
					title={`Name: ${name}`}
				>
					{name || <>&nbsp;</>}
				</P>
				<div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr] items-center gap-x-2 gap-y-0">
					<P
						className="whitespace-nowrap text-muted-foreground text-sm"
						title={`User Id: ${id}`}
					>
						ID:
					</P>
					<P className="truncate text-foreground text-sm">
						{id || <>&nbsp;</>}
					</P>
					<P
						className="whitespace-nowrap text-muted-foreground text-sm"
						title={`Email: ${email}`}
					>
						Email:
					</P>
					<P className="truncate text-foreground text-sm">
						{email || <>&nbsp;</>}
					</P>
					<P
						className="whitespace-nowrap text-muted-foreground text-sm"
						title={`Type: ${type}`}
					>
						Type:
					</P>
					<P className="truncate text-foreground text-sm">
						{type || <>&nbsp;</>}
					</P>
				</div>
			</div>
			{action}
		</div>
	);
};
