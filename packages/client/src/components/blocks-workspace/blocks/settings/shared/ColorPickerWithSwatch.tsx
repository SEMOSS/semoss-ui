import {
	Box,
	FormControl,
	IconButton,
	InputAdornment,
	OutlinedInput,
} from "@semoss/ui";

export interface colorPickerProps {
	value: string;
	onChange: (value: string) => void;
}

export function ColorPickerWithSwatch({ value, onChange }: colorPickerProps) {
	return (
		<FormControl variant="outlined" size="small">
			<OutlinedInput
				id="color-input"
				size="small"
				notched={false}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				endAdornment={
					<InputAdornment position="end">
						<IconButton
							edge="end"
							sx={{ p: 0, width: 24, height: 24 }}
						>
							<input
								type="color"
								value={value}
								onChange={(e) => onChange(e.target.value)}
								style={{
									position: "absolute",
									width: 24,
									height: 24,
									opacity: 0,
									cursor: "pointer",
								}}
							/>
						</IconButton>
						<Box
							sx={{
								width: 24,
								height: 24,
								backgroundColor: value,
								border: "1px solid #ccc",
								borderRadius: "4px",
							}}
						/>
					</InputAdornment>
				}
			/>
		</FormControl>
	);
}
