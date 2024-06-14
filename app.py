from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from datetime import datetime
import os
import numpy as np
import json
import librosa
from python_speech_features import mfcc
from dotenv import load_dotenv
load_dotenv() 
app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes of the Flask app

# Define the directory for storing audio files
AUDIO_DIR = os.path.join(app.root_path, 'audio')
ASSETS_DIR = os.path.join(app.root_path, 'assets')

# Retrieve the API key from the environment variable
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.")
client = OpenAI(api_key=api_key)

@app.route('/')
def static_file():
    return app.send_static_file('index.html')

@app.route('/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_DIR, filename, mimetype='audio/mp3')

@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory(ASSETS_DIR, path)

@app.route('/role-play', methods=['POST'])
def role_play():
    data = request.get_json()
    prompt = data['prompt']
    personality = data['personality']

    try:
        # Use OpenAI's Completion API to generate a text response based on the prompt
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": personality},
                {"role": "user", "content": prompt}
            ]
        )
        # Extract the generated text response from the OpenAI API response
        generated_text = completion.choices[0].message.content

        # Use OpenAI's TTS API to convert text to speech
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=generated_text
        )
        # Generate a unique filename for the audio file using current timestamp
        audio_filename = f"speak_{datetime.now().strftime('%Y%m%d%H%M%S')}.mp3"
        # Save the audio stream to the unique filename in the audio directory
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        response.stream_to_file(audio_path)
        
        # Analyze the audio file and extract mouth openness values
        mouth_openness_values = analyze_audio(audio_path)
        print(mouth_openness_values)  # Debug: Print the mouth openness values
        
        # Save mouth openness values to a file in the audio directory
        mouth_openness_filename = audio_filename.replace('.mp3', '.json')
        mouth_openness_path = os.path.join(AUDIO_DIR, mouth_openness_filename)
        with open(mouth_openness_path, 'w') as f:
            json.dump(mouth_openness_values, f)
        
        return jsonify({
            'response': generated_text,
            'audio_filename': audio_filename,
            'mouth_openness_filename': mouth_openness_filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def analyze_audio(audio_path):
    # Load the audio signal
    y, sr = librosa.load(audio_path, sr=8000)

    # Apply pre-emphasis
    y = np.append(y[0], y[1:] - 0.97 * y[:-1])

    # Extract MFCC features
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

    # Normalize MFCC features
    mfcc_norm = (mfcc - np.mean(mfcc)) / np.std(mfcc)

    # Convert MFCC to energy
    energy = np.sum(mfcc_norm, axis=0)

    # Normalize the energy values between 0 and 1
    normalized_energy = (energy - np.min(energy)) / (np.max(energy) - np.min(energy))

    # Scale the normalized energy values
    mouth_openness = normalized_energy * 1.2  # Adjust the scaling factor as needed

    # Clip the values to ensure they don't exceed 1
    mouth_openness = np.clip(mouth_openness, 0, 1)

    return mouth_openness.tolist()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
