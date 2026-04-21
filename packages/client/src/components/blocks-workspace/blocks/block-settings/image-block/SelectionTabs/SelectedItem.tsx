import { Info, Trash2 } from "lucide-react";
import { Button } from "@semoss/ui/next";

const SelectedItem = ({ file, setData }) => {
	return file ? (
		<div>
			<div className="flex items-center gap-2">
				<span className="text-sm">{file.fileName}</span>
				<Button
					variant="ghost"
					size="icon-sm"
					data-testid="remove-image"
					aria-label="delete"
					onClick={() => {
						setData("src", "");
					}}
				>
					<Trash2 className="size-4 text-destructive" />
				</Button>
			</div>
			<p className="mt-0 flex items-center gap-1 text-muted-foreground text-xs">
				<Info className="size-4" />
				Delete current file to upload a new one.
			</p>
		</div>
	) : null;
};

export default SelectedItem;
