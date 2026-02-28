import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  language?: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (error: { error: string }) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

const VoiceRecorder = forwardRef<
  { startRecording: () => void; stopRecording: () => void },
  VoiceRecorderProps
>(({ onTranscript, language = 'en' }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Language code mapping
  const languageMap: Record<string, string> = {
    en: 'en-US',
    zu: 'zu-ZA',
    xh: 'xh-ZA',
    af: 'af-ZA',
    st: 'st-ZA',
    yo: 'yo-NG',
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('Speech Recognition not supported in your browser');
      return null;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = languageMap[language] || languageMap.en;

    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
      setTranscript('');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.results.length - 1; i >= 0; i--) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
        // Auto-send on final transcript
        setTimeout(() => {
          onTranscript(finalTranscript.trim());
          setTranscript('');
        }, 300);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    return recognition;
  };

  const startRecording = async () => {
    try {
      setIsProcessing(true);
      setError('');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Initialize speech recognition
      if (!recognitionRef.current) {
        recognitionRef.current = initializeSpeechRecognition();
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsProcessing(false);
    } catch (err) {
      setError('Microphone access denied');
      setIsProcessing(false);
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
  };

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
  }));

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="space-y-3">
      {/* Microphone Button */}
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={clsx(
          'w-full py-4 rounded-lg font-bold transition flex items-center justify-center gap-2 text-lg',
          isRecording
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            : 'bg-gold-500 hover:bg-gold-600 text-slate-900',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Initializing...
          </>
        ) : isRecording ? (
          <>
            <MicOff className="w-5 h-5" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            Start Listening
          </>
        )}
      </button>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-slate-600/50 border border-gold-500/30 rounded-lg p-3">
          <p className="text-sm text-slate-100">{transcript}</p>
          <p className="text-xs text-slate-400 mt-2">
            {isRecording ? 'Listening...' : 'Processing...'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-slate-500">
        {isRecording
          ? 'Listening in ' + (languageMap[language] || 'English')
          : 'Tap to start listening'}
      </p>
    </div>
  );
});

VoiceRecorder.displayName = 'VoiceRecorder';

export default VoiceRecorder;
