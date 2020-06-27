import { LarasocketChannel } from './larasocket-channel';
import { OutgoingMessageType } from '../util/outgoing-message';

/**
 * This class represents a Socket.io presence channel.
 */
export class LarasocketPrivateChannel extends LarasocketChannel {
    /**
     * Trigger client event on the channel.
     */
    whisper(eventName: string, data: any): LarasocketChannel {
        const message = this.socket.getSocketMessage(OutgoingMessageType.WHISPER);
        message.channel = this;
        message.event = `client-${eventName}`;
        message.payload = data;
        this.socket.send(message);

        return this;
    }
}
