import {LaravelWebsocketsChannel, LaravelWebsocketsPresenceChannel, LaravelWebsocketsPrivateChannel,} from '../channel';
import {Connector} from "./connector";
import {LaravelWebsocketManager} from "../util/laravel-websocket-manager";

/**
 * This class creates a connector to a Socket.io server.
 */
export class LaravelWebsocketsConnector extends Connector {
    /**
     * The websocket connection instance.
     */
    websocket: any;

    /**
     * All of the subscribed channel names.
     */
    channels: any = {};

    /**
     * Create a fresh Socket.io connection.
     */
    connect(): void {
        this.websocket = new LaravelWebsocketManager(this.options);

        return this.websocket;
    }

    /**
     * Listen for an event on a channel instance.
     */
    listen(name: string, event: string, callback: () => void): LaravelWebsocketsChannel {
        return this.channel(name).listen(event, callback);
    }

    /**
     * Get a channel instance by name.
     */
    channel(name: string): LaravelWebsocketsChannel {
        if (!this.channels[name]) {
            this.channels[name] = new LaravelWebsocketsChannel(this.websocket, name, this.options);
        }

        return this.channels[name];
    }

    /**
     * Get a private channel instance by name.
     */
    privateChannel(name: string): LaravelWebsocketsPrivateChannel {
        if (!this.channels['private-' + name]) {
            this.channels['private-' + name] = new LaravelWebsocketsPrivateChannel(
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
    presenceChannel(name: string): LaravelWebsocketsPresenceChannel {
        if (!this.channels['presence-' + name]) {
            this.channels['presence-' + name] = new LaravelWebsocketsPresenceChannel(
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
        return this.websocket.id;
    }

    /**
     * Disconnect Socketio connection.
     */
    disconnect(): void {
        this.websocket.disconnect();
    }
}
