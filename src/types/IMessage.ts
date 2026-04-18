export interface IMessage {
  id?: string;
  content: string;
  sender: string;
  senderId: string;
  timestamp?: any;
  hasSpoiler?: boolean;
  spoilerChapterRange?: {
    start: number;
    end?: number;
  };
}
