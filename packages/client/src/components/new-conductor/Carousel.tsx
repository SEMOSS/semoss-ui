import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { override } from 'mobx';

interface CarouselProps {
    items: Array<{ title: string; content: string }>;
    itemsToShow?: number;
}

const Carousel: React.FC<CarouselProps> = ({ items, itemsToShow = 1 }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const childrenRef = useRef<HTMLDivElement>(null);

    const handleNext = () => {
        setActiveIndex(
            (prevIndex) => (prevIndex + 1) % (items.length - itemsToShow + 1),
        );
    };

    const handlePrev = () => {
        setActiveIndex(
            (prevIndex) =>
                (prevIndex - 1 + items.length) %
                (items.length - itemsToShow + 1),
        );
    };

    const checkOverflow = () => {
        if (carouselRef.current && childrenRef.current) {
            const carouselWidth = carouselRef.current.offsetWidth;
            const childrenWidth = childrenRef.current.scrollWidth;
            setIsOverflowing(childrenWidth > carouselWidth);
        }
    };

    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        return () => {
            window.removeEventListener('resize', checkOverflow);
        };
    }, [items]);

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 600,
                margin: '0 auto',
                textAlign: 'center',
                border: '3px solid blue',
            }}
        >
            <Box
                ref={carouselRef}
                sx={{
                    overFlow: 'hidden',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    height: 300,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '3px solid pink',
                    borderRadius: 2,
                    padding: 2,
                    width: '100%',
                }}
            >
                <Box
                    ref={childrenRef}
                    sx={{
                        display: 'flex',
                        transform: `translate(-${
                            (activeIndex * 100) / itemsToShow
                        }%)`,
                        transition: 'transform 0.5s ease',
                    }}
                >
                    {items.map((item, index) => (
                        <Box key={index} sx={{ flexShrink: 0, width: '100%' }}>
                            <Typography variant="h4">{item.title}</Typography>
                            <Typography>{item.content}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
            {isOverflowing && (
                <Box
                    sx={{
                        marginTop: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button variant="contained" onClick={handlePrev}>
                        Prev
                    </Button>
                    <Button variant="contained" onClick={handleNext}>
                        Next
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default Carousel;
