import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import '@testing-library/jest-dom';

import { ProjectTileCard } from '../src/components/app/AppCards';

test('app card displays', async () => {
    render(<ProjectTileCard name="app-card-title" />);

    const cardElement = await screen.getByText('app-card-title');
    expect(cardElement).toBeInTheDocument();
});

// describe('project tile card', () => {
//     it('renders', async () => {
//         const handleClick = vi.fn();
//         render(
//             <ProjectTileCard
//                 name={'test card'}
//                 id={'card'}
//                 description={'testing render'}
//                 onClick={handleClick}
//             />,
//         );

//         expect(screen.getByTestId('card')).toBeInTheDocument();
//     });
// });
