import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, Loader2 } from 'lucide-react';
import { diagnoseVoice } from '../utils/api';

export default function VoiceAssistantBtn({ className = '' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [heardText, setHeardText] = useState('');
  const [detectedCategory, setDetectedCategory] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [usedGeolocation, setUsedGeolocation] = useState(false);
  const recognitionRef = useRef(null);
  // Position GPS ambiante, capturée en parallèle de l'écoute vocale (voir
  // toggleListening) — sert de repli quand le client ne précise pas de ville
  // à l'oral. Une ref suffit : on n'affiche rien pendant l'acquisition, on en
  // a juste besoin au moment de l'appel API.
  const coordsRef = useRef(null);

  const handleTranscript = async (transcript) => {
    setHeardText(transcript);
    setDetectedCategory('');
    setDetectedCity('');
    setUsedGeolocation(false);
    setIsProcessing(true);
    setError('');
    try {
      const coords = coordsRef.current;
      const res = await diagnoseVoice({
        transcript,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      setDetectedCategory(res.data.category);
      setDetectedCity(res.data.city || '');
      setIsProcessing(false);
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const params = new URLSearchParams({ profession: res.data.category });
      if (res.data.city) {
        params.set('city', res.data.city);
      } else if (coords) {
        // Pas de ville prononcée : on transmet la position GPS à la page de
        // résultats pour un tri par proximité plutôt que par note.
        params.set('lat', coords.lat);
        params.set('lng', coords.lng);
        setUsedGeolocation(true);
      }
      navigate(`/recherche?${params.toString()}`);
      return;
    } catch (err) {
      setError(err.message || t('home.voiceError'));
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setError(t('home.voiceError'));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleTranscript(transcript);
      };

      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, t]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        const langMap = { fr: 'fr-FR', en: 'en-US', ar: 'ar-MA' };
        recognitionRef.current.lang = langMap[i18n.language] || 'fr-FR';
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
        // Demande la position en parallèle de l'écoute : le temps que l'API
        // Speech Recognition rende un transcript, la géoloc a généralement
        // déjà répondu. Échec/refus silencieux — la position reste optionnelle.
        if (navigator.geolocation) {
          coordsRef.current = null;
          navigator.geolocation.getCurrentPosition(
            (position) => {
              coordsRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };
            },
            () => {
              coordsRef.current = null;
            },
            { timeout: 8000 }
          );
        }
      } else {
        setError(t('home.voiceNotSupported'));
      }
    }
  };

  const isBusy = isListening || isProcessing;

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`w-full h-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm sm:text-base font-bold shadow-lg transition-all border-2 disabled:cursor-wait ${
          isBusy
            ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-red-500/50'
            : 'bg-white border-white text-[#07428c] hover:shadow-xl hover:scale-105'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('home.voiceAnalyzing')}</span>
          </>
        ) : isListening ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('home.voiceListening')}</span>
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 shrink-0" />
            <span className="text-center">{t('home.voiceBtnText')}</span>
          </>
        )}
      </button>
      {heardText && (
        <p className="text-white/90 text-xs sm:text-sm mt-2 text-center">
          {t('home.voiceHeardText', { text: heardText })}
          {detectedCategory && <> {t('home.voiceDetectedCategory')} <strong>{t(`professions.${detectedCategory.toLowerCase()}`, detectedCategory)}</strong></>}
          {detectedCity && <> {t('home.voiceDetectedCity')} <strong>{detectedCity}</strong></>}
          {!detectedCity && usedGeolocation && <> {t('home.voiceNearLocation')}</>}
        </p>
      )}
      {error && <p className="text-red-400 text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}
