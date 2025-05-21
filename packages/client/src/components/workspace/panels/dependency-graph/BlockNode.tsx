import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const BlockNode = ({ data, selected }) => (
    <div
        style={{
            border: selected ? '2px solid #007bff' : '1px solid #bbb',
            borderRadius: 8,
            padding: 16,
            background: '#fff',
            minWidth: 180,
            boxShadow: selected ? '0 0 6px #007bff44' : '0 1px 4px #0001',
            fontFamily: 'Roboto, sans-serif',
        }}
    >
        {/* Top handle for incoming connections */}
        <Handle type="target" position={Position.Top} id="target" />

        {/* Block content */}
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {data.label || 'Block Node'}
        </div>
        <div style={{ color: '#555', fontSize: 13 }}>{data.description}</div>

        {/* Bottom handle for outgoing connections */}
        <Handle type="source" position={Position.Bottom} id="source" />
    </div>
);
