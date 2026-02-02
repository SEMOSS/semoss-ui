import { HelpCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

export const Help = observer((): JSX.Element => {
	const { configStore } = useRootStore();

	if (configStore.theme.helpBannerOrder.length === 0) {
		return null;
	}

	return (
		<div className="fixed right-5 bottom-5">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="rounded-full bg-background shadow-xl"
					>
						<HelpCircleIcon className="size-4" />
						Help
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="top" sideOffset={8}>
					{configStore.theme.helpBannerOrder.map((key) => {
						const v = configStore.theme.helpBannerValues[key];

						if (v) {
							return (
								<DropdownMenuItem
									key={key}
									disabled={v.disabled ? v.disabled : false}
									asChild
								>
									<a
										href={v.src}
										target="_blank"
										rel="noopener noreferrer"
										className="text-foreground no-underline"
									>
										{v.label}
									</a>
								</DropdownMenuItem>
							);
						}

						return null;
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
});
