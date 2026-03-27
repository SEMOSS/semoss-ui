import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui";

const CopyButton = ({ text }: { text: string }) => {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			onClick={(e) => {
				e.stopPropagation();
				navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className={`inline-flex cursor-pointer items-center gap-1 rounded border bg-transparent px-1.5 py-0.5 text-[10px] transition-colors ${
				copied
					? "border-success text-success"
					: "border-border text-muted-foreground hover:border-primary hover:text-primary"
			}`}
		>
			{copied ? (
				<>
					<Check size={10} />
					Copied
				</>
			) : (
				<>
					<Copy size={10} />
					<span className="text-xs">Copy</span>
				</>
			)}
		</Button>
	);
};

export default CopyButton;
