import React, { useEffect } from 'react';
import Navbar from './navbar';
import Game from './game';
import Controls from './controls';
import Footer from './footer';

const GameLayout = () => {
    // Detect if mobile device
    const isMobile = window.innerWidth <= 768;

    // Apply global style fixes on component mount
    useEffect(() => {
        // Apply style reset to eliminate default margins
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.overflow = 'hidden';

        // Cleanup function to reset styles when component unmounts
        return () => {
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.overflow = '';
            document.documentElement.style.margin = '';
            document.documentElement.style.padding = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div className="game-container" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            background: '#f5f5f5' // Optional: adds background to see container edges
        }}>
            {/* Navbar - fixed height */}
            <div style={{ flex: '0 0 auto' }}>
                <Navbar />
            </div>

            {/* Main game area - takes available space */}
            <div style={{
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                padding: '10px',
                boxSizing: 'border-box'
            }}>
                {/* Game board with automatic scaling */}
                <div style={{
                    width: '100%',
                    maxWidth: isMobile ? '95vw' : '70vh',
                    maxHeight: '70vh',
                    display: 'flex',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                }}>
                    <Game />
                </div>

                {/* Controls (only shown on desktop) */}
                {!isMobile && (
                    <div style={{
                        marginTop: '15px',
                        maxHeight: '15vh',
                        boxSizing: 'border-box'
                    }}>
                        <Controls />
                    </div>
                )}
            </div>

            {/* Footer - fixed height */}
            <div style={{
                flex: '0 0 auto',
                padding: '5px',
                boxSizing: 'border-box'
            }}>
                <Footer />
            </div>
        </div>
    );
};

export default GameLayout;