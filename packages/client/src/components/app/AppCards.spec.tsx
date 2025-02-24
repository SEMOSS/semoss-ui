import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// @ts-ignore
global.console = { log: vi.fn() };

import { ProjectTileCard } from './AppCards';

describe('project tile card', () => {
    it('renders', async () => {
        render(<ProjectTileCard title="test card" />);

        const cardTitle = screen.getByText('test card'); // Access the title element

        expect(cardTitle).toBeInTheDocument();
    });
});
