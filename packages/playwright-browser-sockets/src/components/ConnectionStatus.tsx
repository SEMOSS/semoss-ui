import React from 'react';
import type { ConnectionState } from '../types/browserEvents';
import { Chip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CircleIcon from '@mui/icons-material/Circle';

interface ConnectionStatusProps {
  state: ConnectionState;
}

const STATE_CONFIG: Record<ConnectionState, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  idle: { label: 'Idle', color: 'default' },
  connecting: { label: 'Connecting…', color: 'warning' },
  connected: { label: 'Live', color: 'success' },
  error: { label: 'Error', color: 'error' },
  closed: { label: 'Disconnected', color: 'default' },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ state }) => {
  const { label, color } = STATE_CONFIG[state];
  return (
    <Chip
      size="small"
      icon={state === 'connected' ? <WifiIcon /> : state === 'error' ? <WifiOffIcon /> : <CircleIcon />}
      label={label}
      color={color}
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};
