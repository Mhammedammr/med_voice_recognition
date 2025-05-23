// Audio recording and processing module
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.getElementById('analyzeForm');
    const formSelector = document.getElementById('formSelector');
    const formJsonFormat = document.getElementById('formJsonFormat');
    const audioFile = document.getElementById('audioFile');
    const analyzeButton = document.getElementById('analyzeButton');
    const fileLabel = document.getElementById('fileLabel');
    const formError = document.getElementById('formError');
    const audioError = document.getElementById('audioError');
    
    // Recording elements
    const recordButton = document.getElementById('recordButton');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTimer = document.getElementById('recordingTimer');
    const audioPlayback = document.getElementById('audioPlayback');
    const audioPlayer = document.getElementById('audioPlayer');
    
    // Processing indicators
    const statusMessage = document.getElementById('statusMessage');
    const statusMessageText = document.getElementById('statusMessageText');
    const spinnerContainer = document.getElementById('spinnerContainer');
    const processingSteps = document.getElementById('processingSteps');
    const estimatedTimeContainer = document.getElementById('estimatedTimeContainer');
    const estimatedTime = document.getElementById('estimatedTime');

    // Processing steps
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4'),
        document.getElementById('step5')
    ];
    
    // Recording state variables
    let mediaRecorder;
    let audioChunks = [];
    let recordedBlob = null;
    let startTime;
    let timerInterval;
    let isRecording = false;
    let processingTimeout;
    let progressInterval;
    let audioContext;
    let audioAnalyser;
    let audioLevelAnimationFrame;
    
    // Check browser compatibility on load
    checkBrowserCompatibility();
    
    // Setup audio recording
    setupAudioRecording();
    
    /**
     * Check if the browser supports all required audio APIs
     */
    function checkBrowserCompatibility() {
        const compatibility = {
            getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            mediaRecorder: typeof MediaRecorder !== 'undefined',
            audioContext: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined'
        };
        
        const isCompatible = Object.values(compatibility).every(Boolean);
        
        if (!isCompatible) {
            const incompatibleFeatures = Object.entries(compatibility)
                .filter(([_, supported]) => !supported)
                .map(([feature]) => feature);
                
            showToastNotification(
                `Your browser might not fully support audio recording. Missing: ${incompatibleFeatures.join(', ')}. 
                Please try using Chrome, Firefox, or Edge.`, 
                'warning',
                8000
            );
        }
        
        return isCompatible;
    }

    /**
     * Set up audio recording event listeners and UI
     */
    function setupAudioRecording() {
        // Add global key listener for spacebar to trigger recording
        document.addEventListener('keydown', function(event) {
            // Only respond to spacebar if not in a text input
            if (event.code === 'Space' && 
                !(event.target.tagName === 'INPUT' && event.target.type === 'text') &&
                !(event.target.tagName === 'TEXTAREA')) {
                event.preventDefault();
                toggleRecording();
            }
        });
        
        // Add click listener for record button
        recordButton.addEventListener('click', toggleRecording);
        
        // Add keyboard shortcut hint
        const shortcutHint = document.createElement('div');
        shortcutHint.className = 'mt-2 text-xs text-gray-500';
        shortcutHint.textContent = 'Keyboard shortcut: Press spacebar to start/stop recording';
        document.getElementById('recordingControls').appendChild(shortcutHint);
        
        // Initialize audio context if possible
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioContext = new AudioContextClass();
            }
        } catch (e) {
            console.warn('AudioContext initialization failed:', e);
        }
    }

    /**
     * Request access to the user's microphone with fallback options and platform-specific settings
     */
    async function accessMicrophone() {
        try {
            // First check if MediaRecorder is supported
            if (typeof MediaRecorder === 'undefined') {
                throw new Error('MediaRecorder not supported in this browser');
            }

            // Detect operating system for platform-specific optimizations
            const platform = detectOperatingSystem();
            console.log('Detected platform:', platform);
            
            // Configure audio constraints based on platform
            const audioConstraints = getOptimalAudioConstraints(platform);
            
            try {
                console.log('Requesting microphone with constraints:', audioConstraints);
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: audioConstraints,
                    video: false
                });
                
                console.log('Microphone access successful with platform-optimized settings');
                
                // Log audio tracks info
                const audioTracks = stream.getAudioTracks();
                console.log('Audio tracks:', audioTracks.length);
                audioTracks.forEach((track, idx) => {
                    console.log(`Track ${idx} settings:`, track.getSettings());
                });
                
                return stream;
            } catch (initialError) {
                console.warn('Could not access microphone with optimized settings, trying minimal settings:', initialError);
                
                // Fall back to minimal constraints
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: false 
                });
                
                console.log('Microphone access successful with minimal settings');
                return stream;
            }
        } catch (error) {
            // Provide detailed error handling based on error type
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                console.error('Microphone permission denied by user:', error);
                showToastNotification('Microphone access denied. Please allow microphone access in your browser settings.', 'error', 5000);
                
                // Platform-specific permission guidance
                const platform = detectOperatingSystem();
                showPlatformSpecificPermissionGuidance(platform);
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                console.error('No microphone found:', error);
                showToastNotification('No microphone detected. Please connect a microphone and try again.', 'error', 5000);
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                console.error('Microphone is already in use or not readable:', error);
                showToastNotification('Could not access microphone. It may be in use by another application.', 'error', 5000);
            } else {
                console.error('Unexpected microphone error:', error);
                showToastNotification('Error accessing microphone: ' + error.message, 'error', 5000);
            }
            
            throw error;
        }
    }

    /**
     * Detect operating system for platform-specific optimizations
     */
    function detectOperatingSystem() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.indexOf('win') !== -1) return 'windows';
        if (userAgent.indexOf('mac') !== -1) return 'mac';
        if (userAgent.indexOf('linux') !== -1) return 'linux';
        if (userAgent.indexOf('android') !== -1) return 'android';
        if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) return 'ios';
        
        return 'unknown';
    }

    /**
     * Get optimal audio constraints based on operating system
     */
    function getOptimalAudioConstraints(platform) {
        // Base constraints that work reasonably well across platforms
        const baseConstraints = {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true }
        };
        
        // Platform-specific optimizations
        switch(platform) {
            case 'mac':
                // macOS works best with these settings
                return {
                    ...baseConstraints,
                    channelCount: { ideal: 1 },  // Mono recording
                    sampleRate: { ideal: 48000 },
                    sampleSize: { ideal: 16 }
                };
                
            case 'windows':
                // Windows often needs more aggressive noise suppression
                return {
                    ...baseConstraints,
                    noiseSuppression: { ideal: true },
                    echoCancellation: { ideal: true },
                    channelCount: { ideal: 1 }
                };
                
            case 'linux':
                // Linux can be more temperamental, use more basic settings
                return {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1
                };
                
            default:
                // Default settings for other platforms
                return baseConstraints;
        }
    }

    /**
     * Show platform-specific permission guidance
     */
    function showPlatformSpecificPermissionGuidance(platform) {
        switch(platform) {
            case 'windows':
                showToastNotification('Windows users: Check your microphone privacy settings in Windows Settings > Privacy > Microphone', 'info', 8000);
                break;
                
            case 'mac':
                showToastNotification('Mac users: Check your microphone permissions in System Preferences > Security & Privacy > Microphone', 'info', 8000);
                break;
                
            case 'linux':
                showToastNotification('Linux users: Check your system sound settings and ensure your microphone is not muted', 'info', 8000);
                break;
                
            default:
                // No specific guidance for other platforms
                break;
        }
    }

    /**
     * Toggle recording state between start and stop
     */
    async function toggleRecording() {
        if (!isRecording) {
            try {
                // Show indicator that we're attempting to access the microphone
                recordingStatus.textContent = 'Accessing microphone...';
                recordingStatus.classList.remove('text-red-500');
                
                // Get the audio stream
                const stream = await accessMicrophone();
                
                // Check that we have audio tracks before starting
                if (stream.getAudioTracks().length === 0) {
                    throw new Error('No audio tracks available in the stream');
                }
                
                startRecording(stream);
            } catch (err) {
                console.error('Recording error:', err);
                recordingStatus.textContent = 'Error: ' + (err.message || 'Failed to access microphone');
                recordingStatus.classList.add('text-red-500');
            }
        } else {
            stopRecording();
        }
    }

    /**
     * Start recording audio from the given stream
     */
    function startRecording(stream) {
        isRecording = true;
        audioChunks = [];
        
        // Determine the best supported format for this browser
        let options = {};
        
        // Get the platform for optimized recording formats
        const platform = detectOperatingSystem();
        
        // Try to use more widely supported formats in order of preference
        // Platform-specific MIME type preferences
        let mimeTypes = [];
        
        if (platform === 'mac') {
            // macOS generally has good support for these formats
            mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus',
                'audio/wav'
            ];
        } else if (platform === 'windows') {
            // Windows browsers usually support these formats well
            mimeTypes = [
                'audio/webm',
                'audio/webm;codecs=opus',
                'audio/mp4',
                'audio/ogg;codecs=opus',
                'audio/wav'
            ];
        } else {
            // Default order for other platforms including Linux
            mimeTypes = [
                'audio/webm',
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus',
                'audio/mp4',
                'audio/mpeg',
                'audio/wav'
            ];
        }
        
        // Find the first supported MIME type
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                options.mimeType = mimeType;
                console.log(`Using MIME type: ${mimeType}`);
                break;
            }
        }
        
        // Set platform-specific options for better quality
        if (platform === 'mac' || platform === 'windows') {
            // Higher bit rate for better quality on desktop platforms
            options.audioBitsPerSecond = 128000;
        }
        
        try {
            // Create media recorder with best available options
            mediaRecorder = new MediaRecorder(stream, options);
            console.log('MediaRecorder created with options:', options);
            console.log('MediaRecorder state:', mediaRecorder.state);
            
            // Record data in smaller chunks for better reliability
            // Different chunk sizes for different platforms
            const dataInterval = platform === 'mac' ? 250 : 100; // Longer intervals for macOS
            
            // Add an extra data request interval for reliability
            const recordingInterval = setInterval(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.requestData();
                }
            }, 1000);
            
            // Event handler for when data is available
            mediaRecorder.ondataavailable = (event) => {
                console.log('Data available event:', event.data?.size || 0, 'bytes');
                if (event.data && event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            // Event handler for when recording stops
            mediaRecorder.onstop = () => {
                clearInterval(recordingInterval);
                
                console.log('Recording stopped. Chunks collected:', audioChunks.length);
                
                if (audioChunks.length === 0) {
                    showToastNotification('No audio data was recorded. Please check your microphone.', 'error', 5000);
                    recordingStatus.textContent = 'No audio recorded. Check microphone.';
                    recordingStatus.classList.add('text-red-500');
                    
                    resetRecordingState(stream);
                    return;
                }
                
                // Determine the correct MIME type for the blob
                let blobType = 'audio/wav';
                if (mediaRecorder.mimeType && mediaRecorder.mimeType !== '') {
                    blobType = mediaRecorder.mimeType;
                }
                
                // Create blob from recorded chunks
                recordedBlob = new Blob(audioChunks, { type: blobType });
                console.log('Recorded blob:', recordedBlob.size, 'bytes, type:', blobType);
                
                // Create object URL for playback
                const audioURL = URL.createObjectURL(recordedBlob);
                audioPlayer.src = audioURL;
                
                // Show playback controls
                audioPlayback.classList.remove('hidden');
                
                // Update UI
                recordingStatus.textContent = 'Recording completed';
                
                // Stop all visualizations
                cancelAnimationFrame(audioLevelAnimationFrame);
                
                // Remove the level indicator if it exists
                const levelContainer = document.getElementById('audioLevelIndicator');
                if (levelContainer) {
                    levelContainer.classList.add('hidden');
                }
                
                // Reset recording state
                resetRecordingState(stream);
                
                // Show toast notification for recording complete
                showToastNotification('Recording completed successfully!', 'success');
                
                // Validate form
                validateForm();
            };
            
            // Add error handler
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                showToastNotification('Recording error: ' + event.error.message, 'error');
                
                // Stop the recording on error
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                } else {
                    resetRecordingState(stream);
                }
            };

            // Start recording
            mediaRecorder.start(dataInterval);
            console.log('Recording started');
            
            // Update UI
            recordButton.textContent = 'Stop';
            recordButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            recordButton.classList.add('bg-red-600', 'hover:bg-red-700');
            recordingStatus.textContent = 'Recording...';
            
            // Create visual audio level indicator
            createAudioLevelIndicator(stream);
            
            // Start timer
            startTime = Date.now();
            recordingTimer.classList.remove('hidden');
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
            
            // Show toast notification for recording started
            showToastNotification('Recording started. Speak now...', 'info');
        } catch (error) {
            console.error('Error starting MediaRecorder:', error);
            recordingStatus.textContent = 'Error starting recording: ' + error.message;
            recordingStatus.classList.add('text-red-500');
            resetRecordingState(stream);
        }
    }

    /**
     * Reset recording UI and state
     */
    function resetRecordingState(stream) {
        isRecording = false;
        clearInterval(timerInterval);
        
        // Release microphone tracks
        if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Reset UI
        recordButton.textContent = 'Record';
        recordButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        recordButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        recordingTimer.classList.add('hidden');
    }

    /**
     * Stop the current recording
     */
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try {
                console.log('Stopping recording...');
                mediaRecorder.stop();
            } catch (error) {
                console.error('Error stopping MediaRecorder:', error);
                
                // Force cleanup
                isRecording = false;
                clearInterval(timerInterval);
                
                // Update UI
                recordingStatus.textContent = 'Recording stopped with errors';
                recordButton.textContent = 'Record';
                recordButton.classList.remove('bg-red-600', 'hover:bg-red-700');
                recordButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
                recordingTimer.classList.add('hidden');
                
                // Stop visualizations
                cancelAnimationFrame(audioLevelAnimationFrame);
                
                // Hide the level indicator if it exists
                const levelContainer = document.getElementById('audioLevelIndicator');
                if (levelContainer) {
                    levelContainer.classList.add('hidden');
                }
            }
        }
    }

    /**
     * Create a visual audio level indicator
     */
    function createAudioLevelIndicator(stream) {
        try {
            // Clean up any previous audio analysis
            cancelAnimationFrame(audioLevelAnimationFrame);
            
            // Check if AudioContext exists
            if (!audioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    console.log('AudioContext not supported - skipping audio level indicator');
                    return;
                }
                audioContext = new AudioContextClass();
            }
            
            // Resume audio context if it's suspended (browsers may suspend autoplay)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Create analyzer
            audioAnalyser = audioContext.createAnalyser();
            audioAnalyser.fftSize = 256;
            
            // Connect the microphone stream to the analyser
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(audioAnalyser);
            
            // Create or get container for the audio level indicator
            let levelContainer = document.getElementById('audioLevelIndicator');
            if (!levelContainer) {
                levelContainer = document.createElement('div');
                levelContainer.id = 'audioLevelIndicator';
                levelContainer.className = 'mt-2 h-4 bg-gray-200 rounded-full overflow-hidden';
                recordingStatus.parentNode.insertBefore(levelContainer, recordingStatus.nextSibling);
            } else {
                levelContainer.classList.remove('hidden');
            }
            
            // Create the level bar
            let levelBar = document.getElementById('audioLevelBar');
            if (!levelBar) {
                levelBar = document.createElement('div');
                levelBar.id = 'audioLevelBar';
                levelBar.className = 'h-full bg-green-500 transition-all duration-100';
                levelBar.style.width = '0%';
                levelContainer.appendChild(levelBar);
            }
            
            // Update the level bar
            const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
            
            function updateLevel() {
                if (!isRecording) return;
                
                audioAnalyser.getByteFrequencyData(dataArray);
                
                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                
                // Map to percentage (0-100%) with improved sensitivity
                const percentage = Math.min(100, Math.max(0, average * 2.5));
                
                // Update the level bar
                levelBar.style.width = percentage + '%';
                
                // Add color indicators
                if (percentage < 5) {
                    levelBar.className = 'h-full bg-red-500 transition-all duration-100';
                } else if (percentage < 20) {
                    levelBar.className = 'h-full bg-yellow-500 transition-all duration-100';
                } else {
                    levelBar.className = 'h-full bg-green-500 transition-all duration-100';
                }
                
                // Schedule next update
                if (isRecording) {
                    audioLevelAnimationFrame = requestAnimationFrame(updateLevel);
                } else {
                    // Hide and reset the level indicator when not recording
                    levelContainer.classList.add('hidden');
                    levelBar.style.width = '0%';
                }
            }
            
            // Show the level indicator and start updating
            levelContainer.classList.remove('hidden');
            updateLevel();
            
        } catch (error) {
            console.error('Error creating audio level indicator:', error);
            // Continue without the indicator
        }
    }

    /**
     * Update recording timer display
     */
    function updateTimer() {
        const elapsedTime = Date.now() - startTime;
        const seconds = Math.floor((elapsedTime / 1000) % 60).toString().padStart(2, '0');
        const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60).toString().padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${seconds}`;
    }

    /**
     * Show a toast notification
     */
    function showToastNotification(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `px-4 py-2 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-0 ${
            type === 'error' ? 'bg-red-600' :
            type === 'success' ? 'bg-green-600' :
            type === 'warning' ? 'bg-yellow-600' :
            'bg-blue-600'
        }`;
        toast.textContent = message;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('opacity-100');
        }, 10);
        
        // Fade out and remove after specified duration
        setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
                
                // Remove container if empty
                if (toastContainer.children.length === 0) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, duration);
    }

/**
 * Simulate processing progress with visual feedback
 */
function simulateProgress() {
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4'),
        document.getElementById('step5')
    ];
    
    const estimatedTime = document.getElementById('estimatedTime');
    if (!estimatedTime || !steps.every(Boolean)) {
        console.error('Progress elements not found');
        return { progressInterval: null, processingTimeout: null };
    }
    
    // Reset all steps
    steps.forEach(step => {
        const indicator = step.querySelector('.step-indicator');
        if (indicator) {
            indicator.className = 'step-indicator step-pending';
        }
    });
    
    let currentStep = 0;
    let estimatedSeconds = 30;
    
    // Update estimated time function
    function updateEstimatedTime(secondsRemaining) {
        if (!estimatedTime) return;
        
        if (secondsRemaining <= 0) {
            estimatedTime.textContent = 'almost done...';
        } else if (secondsRemaining < 10) {
            estimatedTime.textContent = 'less than 10 seconds';
        } else {
            estimatedTime.textContent = `~${secondsRemaining} seconds`;
        }
    }
    
    // Start with first step
    const firstStepIndicator = steps[currentStep].querySelector('.step-indicator');
    if (firstStepIndicator) {
        firstStepIndicator.className = 'step-indicator step-active';
    }
    
    // Initial estimated time
    updateEstimatedTime(estimatedSeconds);
    
    // Progress interval
    const progressInterval = setInterval(() => {
        // Decrease estimated time
        estimatedSeconds -= 2;
        updateEstimatedTime(estimatedSeconds);
        
        // Move to next step roughly every 5 seconds
        if ((currentStep < 4) && (Math.random() > 0.7 || estimatedSeconds <= (4 - currentStep) * 5)) {
            // Mark current step as completed
            const currentIndicator = steps[currentStep].querySelector('.step-indicator');
            if (currentIndicator) {
                currentIndicator.className = 'step-indicator step-complete';
            }
            
            // Move to next step
            currentStep++;
            const nextIndicator = steps[currentStep].querySelector('.step-indicator');
            if (nextIndicator) {
                nextIndicator.className = 'step-indicator step-active';
            }
        }
    }, 2000);
    
    // Fallback timeout to avoid stuck progress
    const processingTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        
        // Mark all steps as complete
        steps.forEach(step => {
            const indicator = step.querySelector('.step-indicator');
            if (indicator) {
                indicator.className = 'step-indicator step-complete';
            }
        });
        
        if (estimatedTime) {
            estimatedTime.textContent = 'processing is taking longer than expected...';
        }
    }, 60000); // Fallback after 60 seconds
    
    return { progressInterval, processingTimeout };
}


    /**
     * Validate the form inputs
     */
    function validateForm() {
        const hasAudio = audioFile.files.length > 0 || recordedBlob !== null;
        
        if (hasAudio) {
            audioError.classList.add('hidden');
        } else {
            audioError.classList.remove('hidden');
        }
        
        analyzeButton.disabled = !hasAudio;
    }

/**
 * Show status message with enhanced options
 */
function showStatus(message, type = 'info', showProcessingUI = false) {
    const statusDiv = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusMessageText');
    const spinnerContainer = document.getElementById('spinnerContainer');
    const processingSteps = document.getElementById('processingSteps');
    const estimatedTimeContainer = document.getElementById('estimatedTimeContainer');
    
    if (!statusDiv || !statusText) {
        console.error('Status message elements not found');
        return;
    }
    
    statusText.textContent = message;
    
    // Remove d-none class to display the status
    statusDiv.classList.remove('d-none');
    
    // Apply Bootstrap utility classes for different status types
    statusDiv.className = statusDiv.className.replace(/bg-\w+-\d+/g, ''); // Remove any existing bg-* classes
    
    // Add appropriate Bootstrap background color
    if (type === 'error') {
        statusDiv.classList.add('bg-danger', 'text-white');
    } else if (type === 'success') {
        statusDiv.classList.add('bg-success', 'text-white');
    } else {
        statusDiv.classList.add('bg-primary', 'text-white');
    }
    
    // Show/hide processing UI elements
    if (showProcessingUI) {
        if (spinnerContainer) spinnerContainer.classList.remove('d-none');
        if (processingSteps) processingSteps.classList.remove('d-none');
        if (estimatedTimeContainer) estimatedTimeContainer.classList.remove('d-none');
    } else {
        if (spinnerContainer) spinnerContainer.classList.add('d-none');
        if (processingSteps) processingSteps.classList.add('d-none');
        if (estimatedTimeContainer) estimatedTimeContainer.classList.add('d-none');
    }
}

/**
 * Display the results in the UI
 */
function displayResults(data) {
    // Show results section
    const resultsSection = document.getElementById('results');
    resultsSection.classList.remove('d-none');
    
    // Show feedback section
    const feedbackSection = document.getElementById('feedbackSection');
    feedbackSection.classList.remove('d-none');
    
    // Store the result ID for later use when saving feedback
    // Create hidden input if it doesn't exist
    let resultIdInput = document.getElementById('resultId');
    if (!resultIdInput) {
        resultIdInput = document.createElement('input');
        resultIdInput.type = 'hidden';
        resultIdInput.id = 'resultId';
        feedbackSection.appendChild(resultIdInput);
    }
    resultIdInput.value = data.saved_to_db ? data.saved_to_db : '';
    
    // Display raw text
    const rawTextElement = document.getElementById('rawText');
    if (rawTextElement) {
        rawTextElement.textContent = data.raw_text || '';
    }
    
    // Display Arabic text
    const arabicTextElement = document.getElementById('arabicText');
    if (arabicTextElement) {
        arabicTextElement.innerHTML = (data.arabic_text || '').replace(/\n/g, '<br>');
    }
    
    // Display translation text
    const translationTextElement = document.getElementById('translationText');
    if (translationTextElement) {
        translationTextElement.innerHTML = (data.translation_text || '').replace(/\n/g, '<br>');
    }

    // Display reasoning text
    const reasoningTextElement = document.getElementById('reasoningText');
    if (reasoningTextElement) {
        reasoningTextElement.textContent = data.reasoning || '';
    }
    
    // Display JSON data in table
    const tableBody = document.querySelector('#jsonTable tbody');
    if (tableBody) {
        tableBody.innerHTML = ''; // Clear existing content
        
        if (data.json_data && typeof data.json_data === 'object') {
            Object.entries(data.json_data).forEach(([key, value]) => {
                const row = document.createElement('tr');
                
                // Use Bootstrap table classes
                const keyCell = document.createElement('td');
                keyCell.className = 'fw-medium';
                keyCell.textContent = key;
                
                const valueCell = document.createElement('td');
                valueCell.textContent = formatValue(value);
                
                row.appendChild(keyCell);
                row.appendChild(valueCell);
                tableBody.appendChild(row);
            });
        }
    }
    
    // Ensure tabs are working after populating content
    const resultsTabs = document.getElementById('resultsTabs');
    if (resultsTabs) {
        // Force initialization of Bootstrap tabs if needed
        const tabElements = resultsTabs.querySelectorAll('[data-bs-toggle="tab"]');
        tabElements.forEach(tab => {
            // Make sure first tab is active
            if (tab.id === 'transcription-tab') {
                tab.classList.add('active');
            }
        });

        // Show first tab content
        document.getElementById('transcription').classList.add('show', 'active');
    }
}

/**
 * Format any value type for display in results table
 */
function formatValue(value) {
    if (value === null || value === undefined) {
        return '-';
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object') {
        return Object.entries(value)
            .map(([k, v]) => `${k}: ${formatValue(v)}`)
            .join(', ');
    }
    return String(value);
}

    // Form events
    formSelector.addEventListener('change', function() {
        const selectedOption = formSelector.options[formSelector.selectedIndex];
        if (selectedOption.value) {
            formJsonFormat.value = selectedOption.dataset.jsonFormat;
            formError.classList.add('hidden');
        } else {
            formJsonFormat.value = '';
        }
        validateForm();
    });

        // Update file label when a file is selected
        audioFile.addEventListener('change', function() {
            if (audioFile.files.length > 0) {
                fileLabel.textContent = audioFile.files[0].name;
                
                // Clear recorded audio if file is uploaded
                recordedBlob = null;
                audioPlayback.classList.add('hidden');
                
                // Show toast notification for file upload
                showToastNotification('Audio file selected successfully!', 'success');
            } else {
                fileLabel.textContent = 'Upload audio file';
            }
            validateForm();
        });

            // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const hasAudio = audioFile.files.length > 0 || recordedBlob !== null;
        
        if (!hasAudio) {
            audioError.classList.remove('hidden');
            showToastNotification('Please record or upload an audio file', 'error');
            return false;
        }
        
        // Hide any previous results
        document.getElementById('results').classList.add('hidden');
        
        // Show processing status with spinner
        showStatus('Processing your request...', 'info', true);
        
        // Start simulating progress
        simulateProgress();
        
        const formData = new FormData(form);
        
        // If we have recorded audio, add it to the form data
        if (recordedBlob !== null && audioFile.files.length === 0) {
            formData.delete('audio'); // Remove empty file input if exists
            
            // Generate a filename with timestamp and type extension
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = recordedBlob.type.split('/')[1] || 'wav';
            const filename = `recording-${timestamp}.${extension}`;
            
            formData.append('audio', recordedBlob, filename);
        }
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            // Clear processing simulation
            clearTimeout(processingTimeout);
            clearInterval(progressInterval);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Complete all progress steps
            steps.forEach(step => {
                step.querySelector('div').classList.remove('bg-gray-300', 'bg-blue-500');
                step.querySelector('div').classList.add('bg-green-500');
            });
            
            // Show success status after a short delay
            setTimeout(() => {
                showStatus('Analysis completed successfully!', 'success', false);
                displayResults(data);
                
                // Show toast notification for completion
                showToastNotification('Analysis completed successfully!', 'success');
                
                // Scroll to results
                document.getElementById('results').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 500);
        } catch (error) {
            console.error('Error:', error);
            showStatus(`Error: ${error.message}`, 'error', false);
            showToastNotification('An error occurred during processing', 'error');
        }
    });
    // Initial validation
    validateForm();
      

});

document.addEventListener('DOMContentLoaded', function() {
    // Get the save feedback button
    const saveFeedbackButton = document.getElementById('saveFeedbackButton');
    
    if (!saveFeedbackButton) {
        console.error('Save feedback button not found in the DOM');
        return;
    }
    
    /**
 * Show a Bootstrap toast notification
 */
function showToastNotification(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    // Create unique ID for this toast
    const toastId = 'toast-' + Date.now();
    
    // Determine Bootstrap color class based on type
    let bgColorClass = 'bg-primary';
    if (type === 'error') bgColorClass = 'bg-danger';
    else if (type === 'success') bgColorClass = 'bg-success';
    else if (type === 'warning') bgColorClass = 'bg-warning';
    
    // Create toast HTML structure using Bootstrap 5 toast component
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${bgColorClass} text-white border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Get the toast element
    const toastElement = document.getElementById(toastId);
    
    // Initialize Bootstrap toast
    if (window.bootstrap && window.bootstrap.Toast) {
        const toast = new window.bootstrap.Toast(toastElement, {
            autohide: true,
            delay: duration
        });
        
        // Show the toast
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            if (toastElement.parentNode === toastContainer) {
                toastContainer.removeChild(toastElement);
            }
            
            // Remove container if empty
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        });
    } else {
        // Fallback if Bootstrap JS is not available
        toastElement.style.display = 'block';
        
        setTimeout(() => {
            if (toastElement.parentNode === toastContainer) {
                toastContainer.removeChild(toastElement);
            }
            
            // Remove container if empty
            if (toastContainer.children.length === 0 && toastContainer.parentNode) {
                document.body.removeChild(toastContainer);
            }
        }, duration);
    }
}

    // Add click event listener to the save feedback button
    saveFeedbackButton.addEventListener('click', async function() {
        const feedbackInput = document.getElementById('resultFeedback');
        const resultIdInput = document.getElementById('resultId');
        
        if (!feedbackInput) {
            console.error('Feedback input not found');
            return;
        }
        
        if (!resultIdInput) {
            console.error('Result ID input not found');
            return;
        }
        
        const feedback = feedbackInput.value;
        const resultId = resultIdInput.value;
        
        console.log('Submitting feedback:', { resultId, feedback });
        
        try {
            // Show saving indicator
            saveFeedbackButton.disabled = true;
            saveFeedbackButton.textContent = 'Saving...';
            
            const response = await fetch('/save-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    result_id: resultId,
                    feedback: feedback
                })
            });
            
            console.log('Response status:', response.status);
            
            // Always reset the button, regardless of success or failure
            const resetButton = () => {
                saveFeedbackButton.disabled = false;
                saveFeedbackButton.textContent = 'Save Feedback';
            };
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            // Show success message
            showToastNotification('Feedback saved successfully!', 'success');
            // Reset button
            resetButton();
            
        } catch (error) {
            console.error('Error saving feedback:', error);
            showToastNotification('Error saving feedback', 'error');
            // Reset button
            saveFeedbackButton.disabled = false;
            saveFeedbackButton.textContent = 'Save Feedback';
        }
    });
});