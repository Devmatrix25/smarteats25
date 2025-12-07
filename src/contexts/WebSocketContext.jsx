import React, { createContext, useContext } from 'react';

const WebSocketContext = createContext(null);

// Simplified WebSocket Provider - no actual socket connection
// Uses polling via react-query instead for real-time updates
export const WebSocketProvider = ({ children }) => {
    // No-op implementation - all real-time updates use react-query polling
    const value = {
        socket: null,
        connected: false,
        reconnecting: false,
        on: () => { },
        off: () => { },
        emit: () => false,
        joinRoom: () => false,
        leaveRoom: () => false,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        return {
            socket: null,
            connected: false,
            reconnecting: false,
            on: () => { },
            off: () => { },
            emit: () => false,
            joinRoom: () => false,
            leaveRoom: () => false,
        };
    }
    return context;
};
