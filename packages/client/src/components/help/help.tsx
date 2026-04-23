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

	const raw = configStore.store.config.theme.THEME_MAP;
	if (!raw) return null;

	let themeMap: {
		helpBannerOrder: string[];
		helpBannerValues: Record<
			string,
			{ src: string; label: string; disabled?: boolean }
		>;
	};
	try {
		const parsed = JSON.parse(raw);
		themeMap = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
	} catch {
		return null;
	}

	if (!themeMap?.helpBannerOrder?.length) {
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
					{themeMap.helpBannerOrder
						.filter((key) => key !== "tutorials")
						.map((key) => {
							const v = themeMap.helpBannerValues[key];

							if (v) {
								return (
									<DropdownMenuItem
										key={key}
										disabled={
											v.disabled ? v.disabled : false
										}
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
