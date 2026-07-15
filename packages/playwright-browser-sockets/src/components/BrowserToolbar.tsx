import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import type { ConnectionState } from '../types/browserEvents';

interface BrowserToolbarProps {
  currentUrl: string;
  connectionState: ConnectionState;
  isCreating: boolean;
  onStart: (url: string) => void;
  onStop: () => void;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  isRecording: boolean;
  isSaving: boolean;
  canSaveRecording: boolean;
  onToggleRecording: () => void;
  onOpenSaveRecording: () => void;
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
  currentUrl,
  connectionState,
  isCreating,
  onStart,
  onStop,
  onNavigate,
  onBack,
  onForward,
  onReload,
  isRecording,
  isSaving,
  canSaveRecording,
  onToggleRecording,
  onOpenSaveRecording,
}) => {
  const [urlInput, setUrlInput] = useState('https://github.com');
  const isActive = connectionState === 'connected' || connectionState === 'connecting';

  const handleStart = () => {
    const target = urlInput.trim();
    if (!target) return;
    onStart(target);
  };

  const handleNavigate = () => {
    const target = urlInput.trim();
    if (!target) return;
    onNavigate(target);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isActive) handleStart();
      else handleNavigate();
    }
  };

  // Sync URL bar when the browser navigates
  React.useEffect(() => {
    if (currentUrl) setUrlInput(currentUrl);
  }, [currentUrl]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 0,
        flex: 1,
        minWidth: 0,
        bgcolor: 'transparent',
      }}
    >
      {/* Navigation buttons — only active when connected */}
      <Tooltip title="Back">
        <span>
          <IconButton size="small" disabled={!isActive} onClick={onBack}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Forward">
        <span>
          <IconButton size="small" disabled={!isActive} onClick={onForward}>
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Reload">
        <span>
          <IconButton size="small" disabled={!isActive} onClick={onReload}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* URL bar */}
      <TextField
        size="small"
        fullWidth
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://github.com"
        inputProps={{ 'aria-label': 'Browser URL' }}
        sx={{
          flexGrow: 1,
          minWidth: 220,
          '& .MuiInputBase-root': {
            height: 32,
          },
        }}
      />

      {/* Navigate (only when already connected) */}
      {isActive && (
        <Tooltip title="Go">
          <IconButton size="small" color="primary" onClick={handleNavigate}>
            <SendIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Start / Stop */}
      {!isActive ? (
        <Tooltip title="Start session">
          <span>
            <IconButton
              size="small"
              color="success"
              disabled={isCreating}
              onClick={handleStart}
            >
              {isCreating ? <CircularProgress size={18} /> : <PlayArrowIcon />}
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title="Stop viewer socket; browser cache stays available until logout">
          <IconButton size="small" color="error" onClick={onStop}>
            <StopIcon />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={isRecording ? 'Stop recording future interactions' : 'Start recording future interactions'}>
        <span>
          <Button
            size="small"
            variant={isRecording ? 'contained' : 'outlined'}
            color={isRecording ? 'error' : 'inherit'}
            disabled={connectionState !== 'connected'}
            startIcon={<FiberManualRecordIcon fontSize="small" />}
            onClick={onToggleRecording}
            sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 1 }}
          >
            {isRecording ? 'Recording' : 'Record'}
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="Save recording to project recordings folder">
        <span>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            disabled={!canSaveRecording || isSaving}
            startIcon={isSaving ? <CircularProgress size={14} /> : <SaveIcon fontSize="small" />}
            onClick={onOpenSaveRecording}
            sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 1 }}
          >
            Save
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};
