import { LarasocketChannel, LarasocketPresenceChannel, LarasocketPrivateChannel } from '../channel';
import { Connector } from './connector';
import { LarasocketManager } from '../util';

/**
 * This class creates a connector to a Socket.io server.
 */
export class LarasocketConnector extends Connector {
    /**
     * The websocket connection instance.
     */
    websocket!: LarasocketManager;

    /**
     * All of the subscribed channel names.
     */
    channels: any = {};

    /**
     * Create a fresh Socket.io connection.
     */
    connect(): void {
        this.websocket = new LarasocketManager(this.options);
    }

    /**
     * Listen for an event on a channel instance.
     */
    listen(name: string, event: string, callback: () => void): LarasocketChannel {
        return this.channel(name).listen(event, callback);
    }

    /**
     * Get a channel instance by name.
     */
    channel(name: string): LarasocketChannel {
        if (!this.channels[name]) {
            this.channels[name] = new LarasocketChannel(this.websocket, name, this.options);
        }

        return this.channels[name];
    }

    /**
     * Get a private channel instance by name.
     */
    privateChannel(name: string): LarasocketPrivateChannel {
        if (!this.channels['private-' + name]) {
            this.channels['private-' + name] = new LarasocketPrivateChannel(
                this.websocket,
                'private-' + name,
                this.options,
            );
        }

        return this.channels['private-' + name];
    }

    /**
     * Get a presence channel instance by name.
     */
    presenceChannel(name: string): LarasocketPresenceChannel {
        if (!this.channels['presence-' + name]) {
            this.channels['presence-' + name] = new LarasocketPresenceChannel(
                this.websocket,
                'presence-' + name,
                this.options,
            );
        }

        return this.channels['presence-' + name];
    }

    /**
     * Leave the given channel, as well as its private and presence variants.
     */
    leave(name: string): void {
        const channels = [name, 'private-' + name, 'presence-' + name];

        channels.forEach((_name) => {
            this.leaveChannel(_name);
        });
    }

    /**
     * Leave the given channel.
     */
    leaveChannel(name: string): void {
        if (this.channels[name]) {
            this.channels[name].unsubscribe();

            delete this.channels[name];
        }
    }

    /**
     * Get the socket ID for the connection.
     */
    socketId(): string {
        return this.websocket.socketId();
    }

    /**
     * Disconnect Socketio connection.
     */
    disconnect(): void {
        this.websocket.disconnect();
    }
}
