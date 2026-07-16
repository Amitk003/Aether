export interface OutgoingMessage {
  id: string;
  recipientId: string;
  payload: Uint8Array;
  createdAt: number;
  hopCount: number;
}

export interface ExchangeSummary {
  nodeId: string;
  seenMessageIds: string[];
}

export interface ExchangeAction {
  messageId: string;
  payload: Uint8Array;
  recipientId: string;
  hopCount: number;
}
