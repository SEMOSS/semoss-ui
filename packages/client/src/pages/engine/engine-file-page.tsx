import { H3 } from "@semoss/ui/next";
import { FileTable } from "@/components/settings";
import { useEngine } from "@/hooks";

export const EngineFilePage = () => {
	//Grabbing Engine Id for document creation
	const { active } = useEngine();

	return (
		<div className="flex w-full flex-col items-start gap-4 self-stretch">
			<div className="flex w-full justify-between">
				<H3>File Explorer</H3>
			</div>

			<FileTable id={active.id} />
		</div>
	);
};
