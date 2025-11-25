/**
 * WebSocket Service
 * Handles real-time updates for time clock operations
 */

import { Server as WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server as HttpServer } from 'http';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

const WS_READY_STATE_OPEN = 1; // WebSocket.OPEN

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * Initialize WebSocket server
   */
  initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('New WebSocket connection from:', req.socket.remoteAddress);
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        payload: { message: 'Connected to Production Dashboard' },
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    console.log('Received message:', message.type);

    switch (message.type) {
      case 'ping':
        this.send(ws, { type: 'pong', payload: {} });
        break;

      case 'subscribe':
        // Subscribe to specific updates
        this.send(ws, {
          type: 'subscribed',
          payload: { channels: message.payload.channels },
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Send message to a specific client
   */
  private send(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WS_READY_STATE_OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WS_READY_STATE_OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Broadcast employee clocked in event
   */
  broadcastEmployeeClockedIn(entry: any): void {
    this.broadcast({
      type: 'employee:clocked-in',
      payload: entry,
    });
  }

  /**
   * Broadcast employee clocked out event
   */
  broadcastEmployeeClockedOut(entry: any): void {
    this.broadcast({
      type: 'employee:clocked-out',
      payload: entry,
    });
  }

  /**
   * Broadcast timer update event
   */
  broadcastTimerUpdate(entry: any): void {
    this.broadcast({
      type: 'timer:update',
      payload: entry,
    });
  }

  /**
   * Broadcast timer paused event
   */
  broadcastTimerPaused(entry: any): void {
    this.broadcast({
      type: 'timer:paused',
      payload: entry,
    });
  }

  /**
   * Broadcast timer resumed event
   */
  broadcastTimerResumed(entry: any): void {
    this.broadcast({
      type: 'timer:resumed',
      payload: entry,
    });
  }

  /**
   * Broadcast edit request event
   */
  broadcastEditRequest(entry: any): void {
    this.broadcast({
      type: 'edit:requested',
      payload: entry,
    });
  }

  /**
   * Broadcast edit approved event
   */
  broadcastEditApproved(entry: any): void {
    this.broadcast({
      type: 'edit:approved',
      payload: entry,
    });
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }
}
