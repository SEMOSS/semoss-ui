import React, { useState } from 'react';
import { styled } from '@semoss/ui';

const StyledDroppable = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is hovered */
    hovered: boolean;
}>(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // color: selected
    //     ? theme.palette.primary.light
    //     : disabled
    //     ? theme.palette.grey[800]
    //     : 'inherit',
    // textDecoration: 'none',
    // height: theme.spacing(6),
    width: '100%',
    // cursor: disabled ? 'default' : 'pointer',
    // backgroundColor: selected ? '#2A3A4C' : theme.palette.common.black,
    // transition: 'backgroundColor 2s ease',
    '&:hover': {
        // backgroundColor: disabled
        //     ? theme.palette.common.black
        //     : selected
        //     ? theme.palette.primary.main
        //     : `${theme.palette.primary.dark}`,
        transition: 'backgroundColor 2s ease',
        padding: '24px',
    },
}));
const DroppableWrapper: React.FC = ({ children }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovered(true);
    };

    const handleDragLeave = () => {
        setIsHovered(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        // Handle the dropped item here
        setIsHovered(false);
    };

    return (
        <div
            className={`droppable-wrapper`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {children}
        </div>
    );
};

export default DroppableWrapper;
