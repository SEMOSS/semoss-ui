import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import {
	UsageLimitGuide,
	type UsageLimitGuideProps,
} from "./usage-limit-guide";
import {
	USAGE_LIMIT_GUIDE_DESCRIPTION,
	USAGE_LIMIT_GUIDE_TITLE,
} from "./usage-limit-guide-content";

/** Props for {@link UsageLimitGuideSheet}. */
export interface UsageLimitGuideSheetProps
	extends Omit<UsageLimitGuideProps, "className"> {
	/** Whether the sheet is open */
	open: boolean;
	/** Called when the sheet opens or closes */
	onOpenChange: (isOpen: boolean) => void;
}

/**
 * A side sheet with How Usage Limits Work. It opens at the host's section each
 * time, since its content mounts when it opens.
 */
export const UsageLimitGuideSheet = ({
	open,
	onOpenChange,
	...guide
}: UsageLimitGuideSheetProps) => (
	<Sheet open={open} onOpenChange={onOpenChange}>
		<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
			<SheetHeader className="pb-0">
				<SheetTitle className="pe-8">
					{USAGE_LIMIT_GUIDE_TITLE}
				</SheetTitle>
				<SheetDescription>
					{USAGE_LIMIT_GUIDE_DESCRIPTION}
				</SheetDescription>
			</SheetHeader>
			<UsageLimitGuide {...guide} className="px-4 pb-6" />
		</SheetContent>
	</Sheet>
);
