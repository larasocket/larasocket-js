/**
 * This class represents a Socket.io channel.
 */
import { Channel } from './channel';
import { EventFormatter } from '../util';
import { LarasocketManager } from '../util';

export class LarasocketChannel extends Channel {
    eventFormatter: EventFormatter;

    /**
     * The Socket.io client instance.
     */
    socket: LarasocketManager;

    /**
     * The name of the channel.
     */
    name: string;

    /**
     * Channel options.
     */
    options: any;

    /**
     * The event callbacks applied to the channel.
     */
    events: any = {};

    /**
     * Create a new class instance.
     */
    constructor(socket: LarasocketManager, name: string, options: any) {
        super();

        this.eventFormatter = new EventFormatter(options.namespace);
        this.name = name;
        this.socket = socket;
        this.options = options;

        this.subscribe();
    }

    /**
     * Subscribe to a Socket.io channel.
     */
    subscribe(): void {
        this.socket.subscribe(this);
    }

    /**
     * Unsubscribe from channel and ubind event callbacks.
     */
    unsubscribe(): void {
        this.unbind();

        this.socket.unsubscribe(this);
    }

    /**
     * Listen for an event on the channel instance.
     */
    listen(event: string, callback: () => void): LarasocketChannel {
        this.on(event, callback);

        return this;
    }

    /**
     * Stop listening for an event on the channel instance.
     */
    stopListening(event: string): LarasocketChannel {
        const name = this.eventFormatter.format(event);
        this.socket.removeListener(name);
        delete this.events[name];

        return this;
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     */
    on(event: string, callback: (data: any) => void): void {
        this.socket.on(event, callback);
        this.bind(event, callback);
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
            this.socket.removeListener(event);

            delete this.events[event];
        });
    }
}
