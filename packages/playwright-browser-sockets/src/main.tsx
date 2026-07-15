import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { InsightProvider } from '@semoss/sdk-react';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: { mode: 'dark' },
  typography: { fontFamily: 'Inter, system-ui, sans-serif' },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <InsightProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </InsightProvider>
  </React.StrictMode>,
);
