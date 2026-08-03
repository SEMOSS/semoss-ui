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
import { useRoot } from "@/hooks";

export const GlobalDialog: React.FC<{ onAcknowledge?: () => void }> = ({
	onAcknowledge,
}) => {
	const { t } = useTranslation("common");
	const { root } = useRoot();
	const [visible, setVisible] = useCacheState(
		true,
		`global-dialog--${root.getState().theme.dialog?.key}`,
	);

	if (!root.getState().theme.dialog || !visible) {
		return null;
	}

	return (
		<Dialog open={visible}>
			<DialogContent
				className="max-h-[90dvh] grid-rows-[auto_1fr_auto] overflow-hidden sm:max-w-4xl"
				showCloseButton={false}
			>
				<DialogHeader>
					<DialogTitle>
						{root.getState().theme.dialog.title}
					</DialogTitle>
				</DialogHeader>
				<div
					className="overflow-y-auto"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
					dangerouslySetInnerHTML={{
						__html: root.getState().theme.dialog.content,
					}}
				/>
				<DialogFooter>
					<Button
						variant="default"
						onClick={() => {
							setVisible(false);
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
