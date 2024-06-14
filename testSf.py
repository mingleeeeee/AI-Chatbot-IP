import soundfile as sf
import librosa
import pygame
from scipy import signal

 # Load WAV file using soundfile
audio_path="/Users/mingli/Documents/sakaba/An-Interactive-AI-Character-platform-based-on-openai-and-blockchain/static/speak_20240511052701.mp3"

# Librosa analysis
pygame.mixer.init()
pygame.mixer.music.load(audio_path)  
pygame.mixer.music.set_volume(0.8) 

x , sr = librosa.load(data, sr=8000)