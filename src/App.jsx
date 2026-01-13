import React, { useState, useEffect, useRef } from 'react';
import LightBulb from './components/LightBulb';

function App() {
  const [isOn, setIsOn] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const lastClapTime = useRef(0);
  const clapTimeout = useRef(null);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);
      setIsMonitoring(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
        let average = sum / bufferLength;

        // Threshold: 60 is a good starting point for a clap
        if (average > 60) {
          handleClap();
        }
        requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const handleClap = () => {
    const now = Date.now();
    const timeSinceLastClap = now - lastClapTime.current;

    // Prevent 'ghost' triggers from the same clap (cooldown)
    if (timeSinceLastClap < 100) return;

    if (timeSinceLastClap < 400) {
      // DOUBLE CLAP DETECTED
      clearTimeout(clapTimeout.current);
      setIsOn(false);
      lastClapTime.current = 0;
    } else {
      // POTENTIAL SINGLE CLAP
      lastClapTime.current = now;
      clearTimeout(clapTimeout.current);
      clapTimeout.current = setTimeout(() => {
        setIsOn(true);
        lastClapTime.current = 0;
      }, 400);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-700 ${isOn ? 'bg-yellow-50' : 'bg-slate-900'}`}>
      <div className="text-center mb-10">
        <h1 className={`text-3xl font-bold ${isOn ? 'text-slate-900' : 'text-white'}`}>Clap Control</h1>
        <p className={`text-sm ${isOn ? 'text-slate-500' : 'text-slate-400'}`}>1 Clap = ON | 2 Claps = OFF</p>
      </div>

      <LightBulb isOn={isOn} />

      {!isMonitoring ? (
        <button
          onClick={startDetection}
          className="mt-10 px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 shadow-xl"
        >
          Enable Sound Control
        </button>
      ) : (
        <div className="mt-10 flex items-center gap-2 text-green-400 animate-pulse">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span>Listening for Claps...</span>
        </div>
      )}
    </div>
  );
}

export default App;