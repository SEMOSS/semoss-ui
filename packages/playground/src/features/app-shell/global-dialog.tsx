import type React from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	useCacheState,
} from "@semoss/ui/next";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** Props for {@link GlobalDialog}. */
interface GlobalDialogProps {
	/** Called when the user acknowledges the dialog and it closes. */
	onAcknowledge?: () => void;
}

/**
 * The theme's welcome dialog (`theme.dialog`). Once acknowledged it stays
 * closed, remembered per dialog `key`, so a new key shows again.
 */
export const GlobalDialog: React.FC<GlobalDialogProps> = ({
	onAcknowledge,
}) => {
	const { t } = useTranslation("common");
	const theme = usePlaygroundTheme();
	const [isVisible, setIsVisible] = useCacheState(
		true,
		`global-dialog--${theme.dialog?.key}`,
	);

	if (!theme.dialog || !isVisible) {
		return null;
	}

	return (
		<Dialog open={isVisible}>
			<DialogContent
				className="max-h-[90dvh] grid-rows-[auto_1fr_auto] overflow-hidden sm:max-w-3xl"
				showCloseButton={false}
			>
				<DialogHeader>
					<DialogTitle>{theme.dialog.title}</DialogTitle>
				</DialogHeader>
				<div
					className="overflow-y-auto"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
					dangerouslySetInnerHTML={{
						__html: theme.dialog.content,
					}}
				/>
				<DialogFooter>
					<Button
						variant="default"
						onClick={() => {
							setIsVisible(false);
							onAcknowledge?.();
						}}
					>
						{t("navigation.acknowledge")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
