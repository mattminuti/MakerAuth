# MakerAuth
Physical access authentication system using NFC and wifi.
 Intended for door control, machine access control (via power switching), and whatever else seems appropriate.

This is a three-part project, with a board based on the ESP-12 module (esp8266), arduino code that runs on the board, and a server to handle authentication requests.


The server needs to be developed, Django seems like a smart choice. I've done a simple proof-of-concept for hardware testing purposes with nodejs, 'stupidserver.js'.
