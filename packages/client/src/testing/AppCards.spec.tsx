import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import '@testing-library/jest-dom';

import { ProjectTileCard } from '../components/app/AppCards';

test('app card display', async () => {
    render(<ProjectTileCard name="app-card-title" />);

    const cardElement = await screen.getByText('app-card-title');
    expect(cardElement).toBeInTheDocument();
});
