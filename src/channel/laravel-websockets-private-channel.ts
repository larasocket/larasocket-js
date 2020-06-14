import { LaravelWebsocketsChannel } from './laravel-websockets-channel';

/**
 * This class represents a Socket.io presence channel.
 */
export class LaravelWebsocketsPrivateChannel extends LaravelWebsocketsChannel {
    /**
     * Trigger client event on the channel.
     */
    whisper(eventName: string, data: any): LaravelWebsocketsChannel {
        this.socket.emit('client event', {
            channel: this.name,
            event: `client-${eventName}`,
            data: `{data}`,
        });

        return this;
    }
}
