class AudioManager {
    constructor() {
        this.bgMusic = document.getElementById('bgMusic');
        this.isMusicPlaying = true;
        this.currentTrackIndex = -1;
        this.hasUserInteracted = false;

        // List of all available music tracks
        this.musicTracks = [
            'public/audio/Andromeda Applefish.mp3',
            'public/audio/Astrosat Applefish.mp3',
            'public/audio/Earthrise Applefish.mp3',
            'public/audio/Into the Aether - Applefish.mp3',
            'public/audio/Orbital Resonance - Applefish.mp3',
            'public/audio/Particles - Applefish.mp3',
            'public/audio/Primordial Soup - Applefish.mp3',
            'public/audio/Starsoaked - Applefish.mp3',
            'public/audio/The Ocean Held Me Close in Its Arms - Applefish.mp3'
        ];

        // Add event listener for when a track ends
        this.bgMusic.addEventListener('ended', () => this.playNextTrack());
    }

    // Function to get a random track index different from the current one
    getRandomTrackIndex() {
        if (this.musicTracks.length <= 1) return 0;
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.musicTracks.length);
        } while (newIndex === this.currentTrackIndex);
        return newIndex;
    }

    // Function to play the next random track
    playNextTrack() {
        this.currentTrackIndex = this.getRandomTrackIndex();
        this.bgMusic.src = this.musicTracks[this.currentTrackIndex];
        this.bgMusic.play().catch(error => {
            console.log('Autoplay prevented:', error);
            this.isMusicPlaying = false;
        });
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.bgMusic.pause();
        } else {
            this.bgMusic.play();
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    }

    initMusicOnFirstInteraction() {
        if (!this.hasUserInteracted) {
            this.hasUserInteracted = true;
            this.playNextTrack();
        }
    }
}

export default AudioManager;