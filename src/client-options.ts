export type ClientOptions<Topic> = {
    url?: string,
    disablePing?: boolean,
    pingChannel: Topic,
};