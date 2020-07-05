import { LarasocketChannel } from '../channel';

/**
 * SocketMessage
 */
export class Message {
    /**
     * Laravel Websocket API key.
     */
    channel?: LarasocketChannel;

    /**
     * Event namespace.
     */
    event?: string;

    /**
     * Event namespace.
     */
    payload?: any;
}
