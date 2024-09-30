import { useState, useEffect, useRef } from 'react';

export const useTypeWriter = (text = '', speed = 20) => {
    const [displayText, setDisplayText] = useState('');
    const indexRef = useRef(-1);
    let typingInterval;

    const startTyping = () => {
        if (typingInterval) return;
        typingInterval = setInterval(() => {
            if (indexRef.current < text.length && text !== '') {
                indexRef.current += 1;
                setDisplayText(text.slice(0, indexRef.current));
            } else {
                clearInterval(typingInterval);
            }
        }, speed);
    };

    useEffect(() => {
        if (!text.length) return;
        const delayTimeout = setTimeout(startTyping, 100);

        return () => {
            clearTimeout(delayTimeout);
            clearInterval(typingInterval);
        };
    }, [text, speed]);

    useEffect(() => {
        if (text.length < indexRef.current) {
            indexRef.current = text.length;
        }
    }, [text]);

    return displayText;
};
