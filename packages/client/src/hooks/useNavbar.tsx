import {
    NAVBAR_LEFT_ID,
    NAVBAR_MIDDLE_ID,
    NAVBAR_RIGHT_ID,
} from '@/components/shared/navbar/Navbar';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface useNavbarProps {
    /**
     * Content to display on the left side of the top nav
     */
    left: React.ReactNode | null;

    /**
     *  Content to display in middle of the top nav
     */
    middle: React.ReactNode | null;

    /**
     * Content to display on the right side of the top nav
     */
    right: React.ReactNode | null;
}

interface useNavbarReturn {
    /**
     * Content to display on the left side of the top nav
     */
    left: (() => React.ReactNode) | (() => null);

    /**
     *  Content to display in middle of the top nav
     */
    middle: (() => React.ReactNode) | (() => null);

    /**
     * Content to display on the right side of the top nav
     */
    right: (() => React.ReactNode) | (() => null);
}

/**
 * Access the Page Context
 * @returns the Page Context
 */
export function useNavbar({
    left = null,
    middle = null,
    right = null,
}: useNavbarProps): useNavbarReturn {
    const navbarLeft = document.getElementById(NAVBAR_LEFT_ID);
    const navbarMiddle = document.getElementById(NAVBAR_MIDDLE_ID);
    const navbarRight = document.getElementById(NAVBAR_RIGHT_ID);

    return {
        left: navbarLeft ? () => createPortal(left, navbarLeft) : () => null,
        middle: navbarMiddle
            ? () => createPortal(middle, navbarMiddle)
            : () => null,
        right: navbarRight
            ? () => createPortal(right, navbarRight)
            : () => null,
    };
}
