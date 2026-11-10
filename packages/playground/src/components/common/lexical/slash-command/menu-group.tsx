import { useTranslation } from "@semoss/i18n";
import { CommandGroup, CommandItem } from "@semoss/ui/next";
import type { SlashCommand, SlashCommandGroup } from "./types";

interface SlashCommandMenuGroupProps {
	/** The group. */
	group: SlashCommandGroup;
	/** Its commands, in the order the menu lists them. */
	items: SlashCommand[];
	/** Whether commands locked while busy are disabled. */
	isBusy: boolean;
	/** Runs a command the user picked. */
	onSelect: (cmd: SlashCommand) => void;
}

/** One group of the slash menu under its heading. */
export const SlashCommandMenuGroup = ({
	group,
	items,
	isBusy,
	onSelect,
}: SlashCommandMenuGroupProps) => {
	const { t } = useTranslation("room");
	return (
		<CommandGroup heading={t(`slash.groups.${group}`)}>
			{items.map((cmd) => {
				const isDisabled = Boolean(cmd.isLockedWhileBusy && isBusy);
				return (
					<CommandItem
						key={cmd.id}
						value={cmd.id}
						disabled={isDisabled}
						onSelect={() => {
							if (!isDisabled) onSelect(cmd);
						}}
						className="gap-2 max-md:min-h-11"
					>
						<span
							aria-hidden="true"
							className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
						>
							{cmd.icon}
						</span>
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="truncate font-medium text-sm">
								{cmd.label}
							</span>
							{cmd.description && (
								<span className="truncate text-muted-foreground text-xs">
									{cmd.description}
								</span>
							)}
						</div>
					</CommandItem>
				);
			})}
		</CommandGroup>
	);
};
