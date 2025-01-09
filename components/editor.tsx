import React, { useEffect, useRef } from 'react';
import { MathfieldElement } from 'mathlive';

import { StringWrapper } from './equation-editor';

const Editor: React.FC<{ equation: StringWrapper, set: (value: string) => void }> = ({ equation, set }) => {
    const mathFieldRef = useRef<MathfieldElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {

        // Remove all existing MathfieldElements from the document
        //

        if (mathFieldRef.current) {
            return;
        }

        // Create the MathfieldElement
        const mathField = new MathfieldElement();

        // Set initial content (optional)
        mathField.value = equation.value;

        // Listen for input changes
        mathField.addEventListener('input', () => {
            const value = mathField.value;
            set(value);
        });

        // Append MathfieldElement to the container
        if (containerRef.current) {
            containerRef.current.appendChild(mathField);
        }



        // Save reference for future use
        mathFieldRef.current = mathField;

        return () => {
            // Clean up MathfieldElement on component unmount
            if (containerRef.current && mathField) {
                containerRef.current.removeChild(mathField);
            }
            mathFieldRef.current = null;
            containerRef.current = document.createElement('div');
        };
    }, [equation, set]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
            <div ref={containerRef} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', display: 'flex', flexDirection: 'column' }}></div>
        </div>
    );
};

export default Editor;
