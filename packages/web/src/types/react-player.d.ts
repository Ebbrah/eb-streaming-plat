declare module 'react-player' {
  import { Component } from 'react';

  interface ReactPlayerProps {
    url: string;
    playing?: boolean;
    loop?: boolean;
    controls?: boolean;
    light?: boolean | string;
    volume?: number;
    muted?: boolean;
    playbackRate?: number;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
    className?: string;
    progressInterval?: number;
    playsinline?: boolean;
    pip?: boolean;
    stopOnUnmount?: boolean;
    fallback?: React.ReactNode;
    wrapper?: React.ComponentType<any>;
    config?: {
      file?: {
        forceHLS?: boolean;
        attributes?: {
          crossOrigin?: string;
          [key: string]: any;
        };
        [key: string]: any;
      };
      [key: string]: any;
    };
    onReady?: () => void;
    onStart?: () => void;
    onPlay?: () => void;
    onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
    onPause?: () => void;
    onBuffer?: () => void;
    onBufferEnd?: () => void;
    onSeek?: (seconds: number) => void;
    onEnded?: () => void;
    onError?: (error: any) => void;
    onEnablePIP?: () => void;
    onDisablePIP?: () => void;
  }

  export default class ReactPlayer extends Component<ReactPlayerProps> {
    static canPlay(url: string): boolean;
    seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
    getCurrentTime(): number;
    getDuration(): number;
    getInternalPlayer(key?: string): any;
    showPreview(): void;
  }
} 