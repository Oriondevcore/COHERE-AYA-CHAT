import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Volume2, Loader } from 'lucide-react';
import { clsx } from 'clsx';

interface TextToSpeechProps {
  text: string;
  language?: string;
}

const TextToSpeech = forwardRef<
  { playTTS: (text: string, language: string) => Promise<void> },
  TextToSpeechProps
>(({ text, language = 'en' }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voiceMap: Record<string, string> = {
    en: '21m00Tcm4tlvDq8ikWAM',
    zu: '21m00Tcm4tlvDq8ikWAM',
    xh: '21m00Tcm4tlvDq8ikWAM',
    af: '21m00Tcm4tlvDq8ikWAM',
    st: '21m00Tcm4tlvDq8ikWAM',
    yo: '21m00Tcm4tlvDq8ikWAM',
  };

  const playWithElevenLabs = async (textToSpeak: string, lang: string) => {
    try {
      setIsPlaying(true);
      setError('');

      const voiceId = voiceMap[lang] || voiceMap.en;

      const response = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voiceId: voiceId,
        }),
      });

      if (!response.ok) throw new Error('TTS error');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();

        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        audioRef.current.onerror = () => {
          setError('Failed to play');
          setIsPlaying(false);
        };
      }
    } catch (err) {
      setError('TTS error');
      setIsPlaying(false);
    }
  };

  useImperativeHandle(ref, () => ({
    playTTS: playWithElevenLabs,
  }));

  const handlePlayClick = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      await playWithElevenLabs(text, language || 'en');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlayClick}
        disabled={!text || isPlaying}
        className={clsx(
          'flex items-center justify-center w-12 h-12 rounded-lg transition',
          isPlaying
            ? 'bg-gold-600 text-slate-900 animate-pulse'
            : 'bg-gold-500 hover:bg-gold-600 text-slate-900'
        )}
        title="Play text-to-speech"
      >
        {isPlaying ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      <audio ref={audioRef} className="hidden" />

      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
});

TextToSpeech.displayName = 'TextToSpeech';

export default TextToSpeech;