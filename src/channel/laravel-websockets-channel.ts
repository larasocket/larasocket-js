/**
 * This class represents a Socket.io channel.
 */
import {Channel} from './channel';
import {EventFormatter} from '../util';
import {LaravelWebsocketManager} from "../util/laravel-websocket-manager";
import {ChannelSubscription, ChannelSubscriptionStatus} from "../util/channel-subscription";

export class LaravelWebsocketsChannel extends Channel {
    /**
     * The Socket.io client instance.
     */
    socket: LaravelWebsocketManager;

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
     *
     */
    subscription: ChannelSubscription = new ChannelSubscription();

    /**
     * Create a new class instance.
     */
    constructor(socket: LaravelWebsocketManager, name: string, options: any) {
        super();

        this.name = name;
        this.socket = socket;
        this.options = options;

        this.subscribe();
        this.configureReconnector();
    }

    /**
     * Subscribe to a Socket.io channel.
     */
    subscribe(): void {
        this.socket.subscribe(this).then((channelSubscription: ChannelSubscription) => {
            // tslint:disable-next-line
            console.log('Subscribed to channel: ', channelSubscription);
            this.subscription = channelSubscription
        });
    }

    /**
     * Unsubscribe from channel and ubind event callbacks.
     */
    unsubscribe(): void {
        this.unbind();

        this.socket.unsubscribe(this).then(() => {
            // tslint:disable-next-line
            console.log('Unsubscribed to channel');
        });
    }

    /**
     * Listen for an event on the channel instance.
     */
    listen(event: string, callback: () => void): LaravelWebsocketsChannel {
        this.on(event, callback);

        return this;
    }

    /**
     * Stop listening for an event on the channel instance.
     */
    stopListening(event: string): LaravelWebsocketsChannel {
        // const name = this.eventFormatter.format(event);
        // this.socket.removeListener(name);
        // delete this.events[name];

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
     * Attach a 'reconnect' listener and bind the event.
     */
    configureReconnector(): void {
        // const listener = () => {
        //     this.subscribe();
        // };
        //
        // this.socket.on('reconnect', listener);
        // this.bind('reconnect', listener);
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     */
    bind(event: string, callback: (channel: any, data: any) => void): void {
        // this.events[event] = this.events[event] || [];
        // this.events[event].push(callback);
    }

    /**
     * Unbind the channel's socket from all stored event callbacks.
     */
    unbind(): void {
        // Object.keys(this.events).forEach((event) => {
        //     this.events[event].forEach((callback: any) => {
        //         this.socket.removeListener(event, callback);
        //     });
        //
        //     delete this.events[event];
        // });
    }

    /**
     *
     */
    isConnected(): boolean {
        return this.subscription.status === ChannelSubscriptionStatus.CONNECTED && this.subscription.id > 0;
    }
}
