import { Copy } from "lucide-react";
import {
	Avatar,
	AvatarFallback,
	Button,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	toast,
} from "@semoss/ui/next";

interface UserPopoverProps {
	user: { id: string; name: string; email: string } | null;
	children: React.ReactNode;
}

export const UserPopover = ({ user, children }: UserPopoverProps) => {
	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	if (!user) {
		return <>{children}</>;
	}

	return (
		<HoverCard openDelay={300} closeDelay={150}>
			<HoverCardTrigger asChild>
				<span style={{ display: "inline-flex" }}>{children}</span>
			</HoverCardTrigger>
			<HoverCardContent
				side="right"
				align="start"
				sideOffset={5}
				className="z-50 w-auto p-4"
			>
				<div className="flex flex-row gap-4">
					<Avatar className="size-12 shrink-0">
						<AvatarFallback>
							{user.name[0].toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-1">
						<p className="font-medium text-sm">{user.name}</p>
						<div className="flex items-center gap-1">
							<p className="text-muted-foreground text-xs">
								ID: {user.id}
							</p>
							<Button
								variant="ghost"
								size="icon-sm"
								className="size-5"
								onClick={() => {
									handleCopy(user.id);
								}}
							>
								<Copy className="size-3" />
							</Button>
						</div>
						<div className="flex items-center gap-1">
							<p className="text-muted-foreground text-xs">
								Email: {user.email}
							</p>
							<Button
								variant="ghost"
								size="icon-sm"
								className="size-5"
								onClick={() => {
									handleCopy(user.email);
								}}
							>
								<Copy className="size-3" />
							</Button>
						</div>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
};
