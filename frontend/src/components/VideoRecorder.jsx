import { useEffect, useRef, useState } from "react";

/**
 * VideoRecorder
 * --------------
 * Shows a live webcam preview and captures a spoken answer's transcript
 * using the browser's built-in Web Speech API (works in Chrome/Edge).
 * This is a real, working transcript source for day one -- swapping it
 * for server-side Whisper later (see backend/services/speech_analysis.py)
 * only requires changing how `onFinish` is populated, not this component's
 * public interface.
 *
 * NOTE: camera/mic permissions must be granted by the user. If the
 * browser doesn't support SpeechRecognition, the component still shows
 * the video preview and lets the user type their answer manually.
 */
export default function VideoRecorder({ onFinish }) {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCameraError("Camera access denied or unavailable. You can still type your answer below."));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalText = "";
        for (let i = 0; i < event.results.length; i++) {
          finalText += event.results[i][0].transcript + " ";
        }
        setTranscript(finalText.trim());
      };
      recognition.onerror = () => {
        /* fail silently; user can still type manually */
      };
      recognitionRef.current = recognition;
    }

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = () => {
    setTranscript("");
    startTimeRef.current = Date.now();
    setIsRecording(true);
    recognitionRef.current?.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
    const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
    const finalTranscript = (transcript || manualTranscript).trim();
    onFinish({ transcript: finalTranscript, durationSeconds });
  };

  return (
    <div className="video-recorder">
      <video ref={videoRef} autoPlay muted playsInline className="video-preview" />
      {cameraError && <p className="hint-text">{cameraError}</p>}

      <div className="recorder-controls">
        {!isRecording ? (
          <button className="btn btn-primary" onClick={startRecording}>
            🎙️ Start Answer
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopRecording}>
            ⏹ Stop & Submit
          </button>
        )}
      </div>

      {!speechSupported && (
        <div className="manual-transcript">
          <p className="hint-text">
            Speech recognition isn't supported in this browser. Type your answer instead:
          </p>
          <textarea
            rows={4}
            value={manualTranscript}
            onChange={(e) => setManualTranscript(e.target.value)}
            placeholder="Type your answer here..."
          />
        </div>
      )}

      {speechSupported && isRecording && (
        <p className="live-transcript">
          <strong>Live transcript:</strong> {transcript || "(listening...)"}
        </p>
      )}
    </div>
  );
}
