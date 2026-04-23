import { FilePlus2 } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { useFileDrag } from "@/contexts";

export const FileDragOverlay = () => {
	const { t } = useTranslation("common");
	const { isDragging } = useFileDrag();

	if (!isDragging) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background/20 backdrop-blur-xs">
			<FilePlus2 className="size-12 text-foreground" />
			<p className="font-medium text-md">{t("fileDrag.title")}</p>
			<p className="max-w-sm text-center text-muted-foreground text-sm">
				{t("fileDrag.disclaimer")}
			</p>
		</div>
	);
};
