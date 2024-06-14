import replicate
audio = open("speak_20240511001823.wav", "rb")
image = open("chiikawa.png", "rb")
input = {
    "audio": audio,
    "image": image
}

output = replicate.run(
    "cudanexus/makeittalk:e63aa3e0830945d12340aba53c63e27288b5705eec0c8ea0db5b144c5d64dbf6",
    input=input
)
print(output)