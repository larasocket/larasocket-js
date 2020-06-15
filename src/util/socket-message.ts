/**
 * SocketMessage
 */
export class SocketMessage {
    /**
     * Event namespace.
     */
    event: string;

    /**
     * Event namespace.
     */
    payload: object | null;

    /**
     * Create a new class instance.
     */
    constructor(rawJson: any) {
        this.event = rawJson.event;
        this.payload = rawJson.payload ? JSON.parse(rawJson.payload) : null;
    }
}
