import { LarasocketChannel } from './larasocket-channel';

/**
 * This class represents a Socket.io presence channel.
 */
export class LarasocketPrivateChannel extends LarasocketChannel {
    /**
     * Trigger client event on the channel.
     */
    whisper(eventName: string, data: any): LarasocketChannel {
        // this.socket.emit('client event', {
        //     channel: this.name,
        //     event: `client-${eventName}`,
        //     data: `{data}`,
        // });

        return this;
    }
}
