startEyeBlinking()
$(document).ready(function() {
    $('#chatButton').click(function(e) {
        e.preventDefault();

        // Disable the chat button and change color
        $('#chatButton').prop('disabled', true);

        var prompt = $('#prompt').val();
        const personality = $('#personality').val();

        $.ajax({
            url: 'http://localhost:5000/role-play',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ prompt: prompt, personality: personality }),
            success: function(data) {
                $('#response').text(data.response);

                var audioUrl = `http://localhost:5000/audio/${data.audio_filename}`;
                var mouthOpennessUrl = `http://localhost:5000/audio/${data.mouth_openness_filename}`;
                var audioElement = document.getElementById('audioPlayer');
                var sourceElement = document.createElement('source');
                sourceElement.src = audioUrl;
                audioElement.innerHTML = '';
                audioElement.appendChild(sourceElement);

                Promise.all([
                    fetch(mouthOpennessUrl).then(response => response.json()),
                    waitForAudioFile(audioUrl)
                ]).then(([mouthOpennessValues]) => {
                    console.log(mouthOpennessValues);
                    audioElement.load();
                    audioElement.play();
                    animateMouth(mouthOpennessValues, audioElement);
                }).catch(function(error) {
                    console.error('Error loading data:', error);
                }).finally(function() {
                    // Re-enable the chat button and restore color
                    $('#chatButton').prop('disabled', false);
                });
            },
            error: function(err) {
                $('#response').text('Error: ' + err.responseJSON.error);
                // Re-enable the chat button and restore color on error
                $('#chatButton').prop('disabled', false);
            }
        });
    });

    // Function to wait for audio file to be loaded
    function waitForAudioFile(audioUrl) {
        return new Promise(function(resolve, reject) {
            var audio = new Audio(audioUrl);
            audio.onloadeddata = function() {
                resolve();
            };
            audio.onerror = function(error) {
                reject(error);
            };
        });
    }
});

function animateMouth(mouthOpennessValues, audioElement) {
    var interval = 100; // Adjust as needed to match the hop_length in the analysis
    var index = 0;

    function animate() {
        if (index < mouthOpennessValues.length && !audioElement.paused && !audioElement.ended) {
            var mouthOpenValue = mouthOpennessValues[index];
            if (window.currentModel) {
                console.log("Setting mouth openness to:", mouthOpenValue); // Debug: Print the mouth open value
                window.currentModel.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthOpenValue);
            }
            index++;
            setTimeout(animate, interval);
        } else {
            // Ensure the mouth is closed when audio ends
            if (window.currentModel) {
                window.currentModel.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0.0);
            }
        }
    }

    animate();
}

function startEyeBlinking() {
    function blink() {
        if (window.currentModel) {
            // Close eyes
            window.currentModel.internalModel.coreModel.setParameterValueById('ParamEyeLOpen', 0.0);
            window.currentModel.internalModel.coreModel.setParameterValueById('ParamEyeROpen', 0.0);

            // Open eyes after a short delay
            setTimeout(() => {
                window.currentModel.internalModel.coreModel.setParameterValueById('ParamEyeLOpen', 1.0);
                window.currentModel.internalModel.coreModel.setParameterValueById('ParamEyeROpen', 1.0);
            }, 200); // Adjust the delay as needed to make the blink look natural
        }
    }

    // Blink every 5 seconds
    setInterval(blink, 5000);
}
