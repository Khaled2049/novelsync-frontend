export interface IMessage {
  id?: string;
  content: string;
  sender: string;
  timestamp?: any;
  hasSpoiler?: boolean;
  spoilerChapterRange?: {
    start: number;
    end?: number;
  };
}
