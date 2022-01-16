export type PingMessage = {
    message: 'ping',
};
export type InnerMessage<OuterMessage> = PingMessage | OuterMessage;