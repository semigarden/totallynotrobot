import React, { useEffect, useRef, useState } from 'react';
import "styles/CircuitBoard.scss";

// Debounce utility
function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef();
    return (...args) => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    };
}

const CircuitBoard = ({ className = '', source = null, children = null }) => {
    const boardRef = useRef(null);
    const [outlines, setOutlines] = useState([]);

    // Helper to get positions relative to the board
    const getRelativeRect = (childRect, boardRect) => ({
        top: childRect.top - boardRect.top,
        left: childRect.left - boardRect.left,
        width: childRect.width,
        height: childRect.height,
    });

    // Helper to generate a unique selector path for each element
    const getElementPath = (el) => {
        if (!el) return '';
        let path = '';
        while (el && el.nodeType === 1 && el !== source.current) {
            let name = el.nodeName.toLowerCase();
            let parent = el.parentNode;
            if (!parent) break;
            let siblings = Array.from(parent.children).filter(child => child.nodeName === el.nodeName);
            if (siblings.length > 1) {
                let index = siblings.indexOf(el) + 1;
                name += `:nth-of-type(${index})`;
            }
            path = name + (path ? '>' + path : '');
            el = parent;
        }
        return path;
    };

    const calculateOutlines = () => {
        if (!source?.current || !boardRef.current) {
            setOutlines([]); // Clear outlines if source or board is missing
            return;
        }
        const boardRect = boardRef.current.getBoundingClientRect();
        const descendants = Array.from(source.current.querySelectorAll('*'));
        const newOutlines = descendants
            .map((child, idx) => {
                const rect = child.getBoundingClientRect();
                const rel = getRelativeRect(rect, boardRect);
                return {
                    key: `${idx}-${rel.top}-${rel.left}-${rel.width}-${rel.height}`,
                    ...rel
                };
            })
            .filter(outline => outline.width > 0 && outline.height > 0);
        setOutlines(newOutlines);
    };

    useEffect(() => {
        calculateOutlines();
    }, [source]);

    // Debounced resize handler
    const debouncedCalculateOutlines = useDebouncedCallback(calculateOutlines, 100);

    useEffect(() => {
        const handleResize = () => {
            setOutlines([]); // Immediately clear outlines on resize
            debouncedCalculateOutlines(); // Redraw after debounce
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [source, debouncedCalculateOutlines]);

    // console.log(outlines);

    return (
        <div ref={boardRef} className={`circuit-board ${className}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {outlines.map((outline) => (
                <div
                    key={outline.key}
                    className="circuit-board-outline"
                    style={{
                        position: 'absolute',
                        top: outline.top,
                        left: outline.left,
                        width: outline.width,
                        height: outline.height,
                        border: '1px solid #ffffff30',
                        borderRadius: 4,
                        boxSizing: 'border-box',
                        pointerEvents: 'none',
                        // filter: 'blur(4px)',
                    }}
                />
            ))}
            {children}
        </div>
    );
};

export default CircuitBoard;
