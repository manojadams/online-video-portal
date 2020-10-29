# Online-Teaching Video portal
Sample demonstration for running a WebRTC web application where a student and teacher can share video.

## Setup details
1. Run npm install
2. Generate self-signed certificates as video sharing does not work without https well.
3. Open index_https.js file and edit line 7 and 8 to modify the key and self-signed certificate 
4. Run node index_https.js
5. Open https://localhost
6. In any other system within the same network, open https://<hostname or ip address>