import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import React from "react";
import ReactDOM from "react-dom/client";
import { InsightProvider } from "@semoss/sdk-react";
import App from "./App";
import "./index.css";

const theme = createTheme({
	palette: {
		mode: "dark",
		primary: { main: "#36c7b0" },
		error: { main: "#f05267" },
		warning: { main: "#f0b866" },
		background: { default: "#0b1118", paper: "#111a24" },
		divider: "#2a3a4a",
	},
	typography: { fontFamily: "Inter, system-ui, sans-serif" },
	shape: { borderRadius: 6 },
});

const root = document.getElementById("root");
if (!root) {
	throw new Error(
		"The root element is required to start Playwright Sockets.",
	);
}

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<InsightProvider>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<App />
			</ThemeProvider>
		</InsightProvider>
	</React.StrictMode>,
);
