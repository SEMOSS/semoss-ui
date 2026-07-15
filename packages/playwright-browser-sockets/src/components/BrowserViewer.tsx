import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { ClientToServerEvent, ConnectionState } from '../types/browserEvents';

interface BrowserViewerProps {
  connectionState: ConnectionState;
  remoteWidth: number;
  remoteHeight: number;
  latestFrame: string | null; // base64 JPEG
  sendEvent: (event: ClientToServerEvent) => void;
  onUserInput?: () => void;
}

/**
 * Renders the streaming browser frames onto an HTML canvas and forwards
 * user input (mouse, keyboard, scroll) to the Java WebSocket backend.
 */
export const BrowserViewer: React.FC<BrowserViewerProps> = ({
  connectionState,
  remoteWidth,
  remoteHeight,
  latestFrame,
  sendEvent,
  onUserInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fittedCanvasSize = useMemo(() => {
    if (!containerSize.width || !containerSize.height || !remoteWidth || !remoteHeight) {
      return { width: remoteWidth, height: remoteHeight };
    }
    const scale = Math.min(containerSize.width / remoteWidth, containerSize.height / remoteHeight);
    return {
      width: Math.max(1, Math.floor(remoteWidth * scale)),
      height: Math.max(1, Math.floor(remoteHeight * scale)),
    };
  }, [containerSize.height, containerSize.width, remoteHeight, remoteWidth]);

  // ─── Draw incoming frames onto the canvas ───────────────────────────────
  useEffect(() => {
    if (!latestFrame || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/jpeg;base64,${latestFrame}`;
  }, [latestFrame]);

  // ─── Coordinate scaling helper ─────────────────────────────────────────
  const toRemoteCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: clientX, y: clientY };
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (remoteWidth / rect.width);
      const y = (clientY - rect.top) * (remoteHeight / rect.height);
      return { x: Math.max(0, Math.min(x, remoteWidth)), y: Math.max(0, Math.min(y, remoteHeight)) };
    },
    [remoteWidth, remoteHeight],
  );

  // ─── Mouse events ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      onUserInput?.();
      const { x, y } = toRemoteCoords(e.clientX, e.clientY);
      const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
      sendEvent({ type: 'mouse-down', x, y, button });
    },
    [onUserInput, sendEvent, toRemoteCoords],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      onUserInput?.();
      const { x, y } = toRemoteCoords(e.clientX, e.clientY);
      const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
      sendEvent({ type: 'mouse-up', x, y, button });
    },
    [onUserInput, sendEvent, toRemoteCoords],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onUserInput?.();
      const { x, y } = toRemoteCoords(e.clientX, e.clientY);
      const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
      sendEvent({ type: 'mouse-click', x, y, button });
    },
    [onUserInput, sendEvent, toRemoteCoords],
  );

  // Throttle mouse-move to every 32 ms (~30 events/sec) to avoid flooding
  const lastMoveTime = useRef(0);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime.current < 32) return;
      lastMoveTime.current = now;
      const { x, y } = toRemoteCoords(e.clientX, e.clientY);
      sendEvent({ type: 'mouse-move', x, y });
    },
    [sendEvent, toRemoteCoords],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // prevent browser context menu over the canvas
  }, []);

  // ─── Scroll ────────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      onUserInput?.();
      e.preventDefault();
      const { x, y } = toRemoteCoords(e.clientX, e.clientY);
      sendEvent({ type: 'wheel', x, y, deltaX: e.deltaX, deltaY: e.deltaY });
    },
    [onUserInput, sendEvent, toRemoteCoords],
  );

  // ─── Keyboard ─────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      onUserInput?.();
      // Prevent default for keys that would otherwise trigger browser actions
      const passthroughKeys = [
        'Tab', 'Enter', 'Escape', 'Backspace', 'Delete',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Home', 'End', 'PageUp', 'PageDown',
      ];
      if (passthroughKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }

      const modifiers = {
        alt: e.altKey,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
      };

      // For printable characters, send type-text (handles shift/accents naturally)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        sendEvent({ type: 'type-text', text: e.key });
      } else {
        sendEvent({ type: 'key', key: e.key, code: e.code, modifiers });
      }
    },
    [onUserInput, sendEvent],
  );

  // ─── Rendering ────────────────────────────────────────────────────────
  const isConnected = connectionState === 'connected';
  const isIdle = connectionState === 'idle';

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        bgcolor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isConnected ? 'crosshair' : 'default',
      }}
    >
      {/* Idle state prompt */}
      {isIdle && (
        <Box sx={{ textAlign: 'center', color: 'grey.500' }}>
          <Typography variant="h6">Remote Browser Viewer</Typography>
          <Typography variant="body2" mt={1}>
            Enter a URL above and click Start to open a remote browser session.
          </Typography>
        </Box>
      )}

      {/* Connecting spinner */}
      {connectionState === 'connecting' && <CircularProgress color="primary" />}

      {/* Error state */}
      {connectionState === 'error' && (
        <Typography color="error.main">Connection failed. Try restarting the session.</Typography>
      )}

      {/* Browser canvas — shown once connected */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        style={{
          display: isConnected || latestFrame ? 'block' : 'none',
          width: fittedCanvasSize.width,
          height: fittedCanvasSize.height,
          objectFit: 'contain',
          outline: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
};
