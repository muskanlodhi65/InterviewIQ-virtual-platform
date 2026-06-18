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
  const isRecordingRef = useRef(false);
  const accumulatedRef = useRef("");

  const [isRecording, setIsRecording] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [micListening, setMicListening] = useState(false);

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() =>
        setCameraError(
          "Camera/Mic access denied. Please allow permissions and refresh. You can also type your answer below."
        )
      );

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setMicListening(true);

      recognition.onresult = (event) => {
        let interimText = "";
        let newFinal = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            newFinal += result[0].transcript + " ";
          } else {
            interimText += result[0].transcript;
          }
        }

        if (newFinal) {
          accumulatedRef.current += newFinal;
        }

        setDisplayTranscript((accumulatedRef.current + interimText).trim());
      };

      recognition.onerror = (e) => {
        if (e.error === "no-speech") return;
        console.warn("[Speech recognition error]", e.error);
        setMicListening(false);
      };

      recognition.onend = () => {
        setMicListening(false);
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (_) {
            /* already started */
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isRecordingRef.current = false;
      stream?.getTracks().forEach((t) => t.stop());
      try { recognitionRef.current?.stop(); } catch (_) {}
    };
  }, []);

  const startRecording = () => {
    accumulatedRef.current = "";
    setDisplayTranscript("");
    startTimeRef.current = Date.now();
    isRecordingRef.current = true;
    setIsRecording(true);
    try {
      recognitionRef.current?.start();
    } catch (_) {
      /* already running */
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setMicListening(false);
    try { recognitionRef.current?.stop(); } catch (_) {}

    const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
    const finalTranscript = (accumulatedRef.current || displayTranscript || manualTranscript).trim();
    onFinish({ transcript: finalTranscript, durationSeconds });
  };

  return (
    <div className="video-recorder">
      <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="video-preview"
          style={{ width: "100%", maxWidth: "100%", minHeight: "360px", maxHeight: "560px", objectFit: "cover", borderRadius: "12px", border: "1px solid #30363d", background: "#000" }}
        />
        {isRecording && (
          <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(248,81,73,0.9)", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1s infinite" }} />
            REC
          </div>
        )}
        {isRecording && micListening && (
          <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(63,185,80,0.9)", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
            🎙️ Mic Active
          </div>
        )}
      </div>

      {cameraError && <p className="hint-text" style={{ marginTop: 8 }}>{cameraError}</p>}

      <div className="recorder-controls">
        {!isRecording ? (
          <button className="btn btn-primary" onClick={startRecording}>
            🎙️ Start Answer
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopRecording}>
            ⏹ Stop &amp; Submit
          </button>
        )}
      </div>

      {!speechSupported && (
        <div className="manual-transcript">
          <p className="hint-text">
            Speech recognition isn't supported in this browser (use Chrome/Edge). Type your answer instead:
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
        <div className="live-transcript">
          <strong>🎙️ Live transcript:</strong>{" "}
          {displayTranscript ? (
            <span>{displayTranscript}</span>
          ) : (
            <span className="hint-text">(speak now... listening)</span>
          )}
        </div>
      )}

      {speechSupported && !isRecording && displayTranscript && (
        <div className="live-transcript">
          <strong>Your answer:</strong> {displayTranscript}
        </div>
      )}
    </div>
  );
}
