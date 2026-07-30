import {
	Alert,
	AlertDescription,
	Button,
	Input,
	Spinner,
} from "@semoss/ui/next";

interface PlaygroundStartPromptProps {
	value: string;
	isCreating: boolean;
	onChange: (value: string) => void;
	onOpen: () => void;
}

export function PlaygroundStartPrompt({
	value,
	isCreating,
	onChange,
	onOpen,
}: PlaygroundStartPromptProps) {
	return (
		<div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
			<Alert>
				<AlertDescription>
					Enter a URL to start recording.
				</AlertDescription>
			</Alert>
			<div className="flex gap-2">
				<Input
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && value.trim()) onOpen();
					}}
					placeholder="https://example.com"
					autoFocus
				/>
				<Button disabled={!value.trim() || isCreating} onClick={onOpen}>
					{isCreating && <Spinner />}
					Open
				</Button>
			</div>
		</div>
	);
}
