import json
from typing import List, Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages active WebSockets connections, handling direct messaging, 
    broadcasting notifications, and streaming real-time metrics telemetry.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_text(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle dead connections silently
                pass

    async def broadcast_json(self, data: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass

# Singleton manager
ws_manager = ConnectionManager()
