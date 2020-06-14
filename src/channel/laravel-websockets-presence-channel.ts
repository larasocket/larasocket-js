import { LaravelWebsocketsPrivateChannel } from './laravel-websockets-private-channel';
import {PresenceChannel} from "./presence-channel";


/**
 * This class represents a Socket.io presence channel.
 */
export class LaravelWebsocketsPresenceChannel extends LaravelWebsocketsPrivateChannel implements PresenceChannel {
    /**
     * Register a callback to be called anytime the member list changes.
     */
    here(callback: (member: any) => void): LaravelWebsocketsPresenceChannel {
        this.on('presence:subscribed', (members: any[]) => {
            callback(members.map((m) => m.user_info));
        });

        return this;
    }

    /**
     * Listen for someone joining the channel.
     */
    joining(callback: (member: any) => void): LaravelWebsocketsPresenceChannel {
        this.on('presence:joining', (member: any) => callback(member.user_info));

        return this;
    }

    /**
     * Listen for someone leaving the channel.
     */
    leaving(callback: (member: any) => void): LaravelWebsocketsPresenceChannel {
        this.on('presence:leaving', (member: any) => callback(member.user_info));

        return this;
    }
}
