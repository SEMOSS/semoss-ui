import { Alert, Button, Stack, TextField, Typography } from "@mui/material";

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
		<Alert
			severity="info"
			sx={{ mx: 0.5, mt: 0.5, py: 0.5, alignItems: "center" }}
			action={
				<Button
					size="small"
					variant="contained"
					disabled={isCreating || !value.trim()}
					onClick={onOpen}
				>
					Open
				</Button>
			}
		>
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
				sx={{ minWidth: 360 }}
			>
				<Typography variant="body2">
					Enter a URL to start recording.
				</Typography>
				<TextField
					size="small"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") onOpen();
					}}
					placeholder="https://google.com"
					sx={{ minWidth: 240 }}
				/>
			</Stack>
		</Alert>
	);
}
