export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechService {
  private recognition: any;
  private isListening: boolean = false;
  
  constructor() {
    // Check if SpeechRecognition is available in the browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.configureRecognition();
    } else {
      console.warn('Speech recognition is not supported in this browser');
      this.recognition = null;
    }
  }
  
  private configureRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }
  
  public isSupported(): boolean {
    return !!this.recognition;
  }
  
  public isInIframe(): boolean {
    try {
      return window !== window.top;
    } catch (e) {
      // If we can't access window.top due to security restrictions, 
      // we're definitely in an iframe
      return true;
    }
  }
  
  // Request microphone permission explicitly
  public async requestMicrophonePermission(): Promise<boolean> {
    // If we're in an iframe, don't even try to request permission
    // as it will likely fail and cause console errors
    if (this.isInIframe()) {
      console.log("In iframe, skipping microphone permission request");
      return false;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If we get here, permission was granted
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.warn('Microphone permission denied:', error);
      return false;
    }
  }
  
  public async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }
    
    if (this.isListening) {
      return;
    }
    
    // If in iframe, don't even try to start speech recognition
    if (this.isInIframe()) {
      onError('Speech recognition is not available in embedded mode');
      return;
    }
    
    // First, explicitly request microphone permission
    try {
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        onError('Microphone permission denied. Please allow microphone access.');
        return;
      }
    } catch (error) {
      onError('Failed to request microphone permission');
      return;
    }
    
    this.isListening = true;
    
    // Handle recognition results
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      
      onResult({
        transcript,
        isFinal: result.isFinal
      });
    };
    
    // Handle errors with specific error messages
    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Microphone access is blocked. Please allow it in your browser settings.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak louder or check your microphone.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone detected. Please check your device.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        case 'language-not-supported':
          errorMessage = 'Language not supported.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech service not allowed.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
      this.isListening = false;
    };
    
    // Handle when speech recognition ends
    this.recognition.onend = () => {
      // Only restart if we're still in listening mode
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Failed to restart speech recognition:', e);
          this.isListening = false;
          onError('Speech recognition stopped unexpectedly');
        }
      }
    };
    
    try {
      this.recognition.start();
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      onError(`Failed to start speech recognition: ${error}`);
    }
  }
  
  public stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
        console.log('Speech recognition stopped');
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  }
}

// Add this to global Window type
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}