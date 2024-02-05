import React from 'react';
import '@testing-library/jest-dom';
import { AppTemplates } from './AppTemplates';
import { render, screen } from '@testing-library/react';

const defaultProps = {
    onUse: () => {},
};

test('renders the default App Templates', () => {
    render(<AppTemplates {...defaultProps} />);
    expect(screen.getByText(/Hello World/i)).toBeVisible();

    expect(screen.getByText(/Ask CSV/i)).toBeVisible();
});
