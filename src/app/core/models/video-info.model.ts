import type { Platform } from '../platform';

export interface VideoQuality {
  id: string;
  height: number | null;
  label: string;
  estimatedBytes: number | null;
}

export interface AudioFormatOption {
  id: 'mp3' | 'wav';
  label: string;
  estimatedBytes: number | null;
}

// Spiegelt die Response von GET /api/info (server/services/ytdlp.service.mjs, toVideoInfo()).
export interface VideoInfo {
  platform: Platform;
  platformLabel: string;
  sourceUrl: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  videoQualities: VideoQuality[];
  audioFormats: AudioFormatOption[];
}
