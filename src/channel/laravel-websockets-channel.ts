/**
 * This class represents a Socket.io channel.
 */
import { Channel } from './channel';
import { EventFormatter } from '../util';

export class LaravelWebsocketsChannel extends Channel {
    /**
     * The Socket.io client instance.
     */
    socket: any;

    /**
     * The name of the channel.
     */
    name: any;

    /**
     * Channel options.
     */
    options: any;

    /**
     * The event formatter.
     */
    eventFormatter: EventFormatter;

    /**
     * The event callbacks applied to the channel.
     */
    events: any = {};

    /**
     * Create a new class instance.
     */
    constructor(socket: any, name: string, options: any) {
        super();

        this.name = name;
        this.socket = socket;
        this.options = options;
        this.eventFormatter = new EventFormatter(this.options.namespace);

        this.subscribe();
        this.configureReconnector();
    }

    /**
     * Subscribe to a Socket.io channel.
     */
    subscribe(): void {
        this.socket.emit('subscribe', {
            channel: this.name,
            auth: this.options.auth || {},
        });
    }

    /**
     * Unsubscribe from channel and ubind event callbacks.
     */
    unsubscribe(): void {
        this.unbind();

        this.socket.emit('unsubscribe', {
            channel: this.name,
            auth: this.options.auth || {},
        });
    }

    /**
     * Listen for an event on the channel instance.
     */
    listen(event: string, callback: () => void): LaravelWebsocketsChannel {
        this.on(this.eventFormatter.format(event), callback);

        return this;
    }

    /**
     * Stop listening for an event on the channel instance.
     */
    stopListening(event: string): LaravelWebsocketsChannel {
        const name = this.eventFormatter.format(event);
        this.socket.removeListener(name);
        delete this.events[name];

        return this;
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     */
    on(event: string, callback: (data: any) => void): void {
        const listener = (channel: any, data: any) => {
            if (this.name === channel) {
                callback(data);
            }
        };

        this.socket.on(event, listener);
        this.bind(event, listener);
    }

    /**
     * Attach a 'reconnect' listener and bind the event.
     */
    configureReconnector(): void {
        const listener = () => {
            this.subscribe();
        };

        this.socket.on('reconnect', listener);
        this.bind('reconnect', listener);
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     */
    bind(event: string, callback: (channel: any, data: any) => void): void {
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }

    /**
     * Unbind the channel's socket from all stored event callbacks.
     */
    unbind(): void {
        Object.keys(this.events).forEach((event) => {
            this.events[event].forEach((callback: any) => {
                this.socket.removeListener(event, callback);
            });

            delete this.events[event];
        });
    }
}
