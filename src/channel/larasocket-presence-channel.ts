import { LarasocketPrivateChannel } from './larasocket-private-channel';

/**
 * This class represents a Socket.io presence channel.
 */
export class LarasocketPresenceChannel extends LarasocketPrivateChannel {
    /**
     * Register a callback to be called anytime the member list changes.
     */
    here(callback: (member: any[]) => void): LarasocketPresenceChannel {
        this.on('.presence:subscribed', callback);

        return this;
    }

    /**
     * Listen for someone joining the channel.
     */
    joining(callback: (member: any) => void): LarasocketPresenceChannel {
        this.on('.presence:joining', callback);

        return this;
    }

    /**
     * Listen for someone leaving the channel.
     */
    leaving(callback: (member: any) => void): LarasocketPresenceChannel {
        this.on('.presence:leaving', callback);

        return this;
    }
}
