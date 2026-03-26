import { observer } from "mobx-react-lite";
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

export const GlobalDialog: React.FC = observer(() => {
	const { t } = useTranslation("common");
	const { root } = useRoot();
	const [visible, setVisible] = useCacheState(
		true,
		`global-dialog--${root.theme.dialog?.key}`,
	);

	if (!root.theme.dialog || !visible) {
		return null;
	}

	return (
		<Dialog open={visible}>
			<DialogContent className="sm:max-w-4xl max-h-[90dvh] grid-rows-[auto_1fr_auto] overflow-hidden" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{root.theme.dialog.title}</DialogTitle>
				</DialogHeader>
				<div
					className="overflow-y-auto"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
					dangerouslySetInnerHTML={{
						__html: root.theme.dialog.content,
					}}
				/>
				<DialogFooter>
					<Button
						variant="default"
						onClick={() => {
							// close it
							setVisible(false);
						}}
					>
						{t("navigation.acknowledge")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
