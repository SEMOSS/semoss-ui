import Editor, { useMonaco } from "@monaco-editor/react";
import { Suspense, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Box, LoadingScreen, styled, useTheme } from "@semoss/ui";

export const RDFMapPage = () => {
	const [code, setCode] = useState<string>("");
	const monaco = useMonaco();
	const theme = useTheme();

	useEffect(() => {
		const fetchRDFMap = async () => {
			const response = await runPixel<[string]>(`AdminGetRDFMap()`);
			setCode(response.pixelReturn[0].output || "");
		};
		fetchRDFMap();
	}, []);

	// Setup custom language + theme
	useEffect(() => {
		if (monaco) {
			// Register a custom language if not already registered
			monaco.languages.register({ id: "rdfmap" });

			monaco.languages.setMonarchTokensProvider("rdfmap", {
				tokenizer: {
					root: [
						// Whole line comments starting with #
						[/^#.*/, "comment"],

						// Key = first word until space or '='
						[/^\s*[^=\s]+/, "key"],

						// Value = everything after space or '=' until line end
						[/[=\s]+[^#]+$/, "value"],
					],
				},
			});

			// Define theme for custom tokens
			monaco.editor.defineTheme("rdfmapTheme", {
				base: "vs", // light theme
				inherit: false,
				rules: [
					{
						token: "comment",
						foreground: theme.palette.text.primary,
					}, // black
					{ token: "key", foreground: theme.palette.success.main }, // green
					{ token: "value", foreground: theme.palette.primary.main }, // blue
				],
				colors: {}, // Add empty colors object
			});
		}
	}, [monaco]);

	const StyledContent = styled("div")(({ theme }) => ({
		marginTop: theme.spacing(2),
		borderRadius: "15px",
		backgroundColor: theme.palette.background.paper,
		minHeight: theme.spacing(60),
	}));

	const StyledTitleBox = styled(Box)(({ theme }) => ({
		padding: theme.spacing(2),
		backgroundColor: theme.palette.primary.selected,
		color: theme.palette.text.secondary,
		borderTopLeftRadius: "15px",
		borderTopRightRadius: "15px",
	}));

	const StyledCodeBox = styled("div")(({ theme }) => ({
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		height: "460px",
		width: "100%",
		paddingTop: "10px",
		background: theme.palette.background.paper,
	}));

	return (
		<StyledContent>
			<StyledTitleBox>RDF_Map.prop</StyledTitleBox>
			<StyledCodeBox>
				<Suspense
					fallback={
						<LoadingScreen.Trigger description="Loading..." />
					}
				>
					<Editor
						width="100%"
						height="100%"
						value={code}
						language="rdfmap" // custom language
						theme="rdfmapTheme" // custom theme
						options={{
							readOnly: true,
						}}
					/>
				</Suspense>
			</StyledCodeBox>
		</StyledContent>
	);
};
