import { H3 } from "@semoss/ui/next";
import { FileTable } from "@/components/settings";
import { useEngine } from "@/hooks";

export const EngineFilePage = () => {
	//Grabbing Engine Id for document creation
	const { active } = useEngine();

	return (
		<div className="flex w-full flex-col items-start gap-6 self-stretch">
			<div className="flex w-full justify-between">
				<H3>File Explorer</H3>
			</div>

			<div className="w-full rounded-xl p-2 shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
				<FileTable id={active.id} />
			</div>
		</div>
	);
};
