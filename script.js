'use strict';

const socket = io();
let users = [];
const selfid = document.location.hostname;

// communication using socketio
function register() {
    // register itself
    socket.emit('new-user', selfid);

    // on new user detection
    socket.on('new-user', (userid) => {
        users.push(userid);
        listUsers();
    });

    socket.on('old-users', (usersList) => {
        console.log('users:\t' + users);
        users = users.concat(usersList);
        listUsers();
    });

    socket.on('request-offer', (requestUserId) => {
        console.log('request for making-offer received');
        if (localStream) {
            localPeerConnection = new RTCPeerConnection(servers);
            localPeerConnection.addStream(localStream);

            localPeerConnection.createOffer().then(description => {
                localPeerConnection.setLocalDescription(description);
                socket.emit('offer', selfid, description);
            });
            localPeerConnection.addEventListener('icecandidate', (event) => {
                const candidate = event.candidate;
                if (candidate) {
                    socket.emit('candidate', selfid, candidate);
                }
            });
        } else {
            navigator.mediaDevices.getUserMedia(videoOptions).then(stream => {
                localStream = stream;
                localPeerConnection = new RTCPeerConnection(servers);
                stream.getTracks().forEach(t => localPeerConnection.addTrack(t, stream));
                localPeerConnection.addStream(localStream);
                localPeerConnection.createOffer().then(description => {
                    localPeerConnection.setLocalDescription(description);
                    socket.emit('offer', selfid, description);
                });
                localPeerConnection.addEventListener('icecandidate', (event) => {
                    const candidate = event.candidate;
                    if (candidate) {
                        socket.emit('candidate', selfid, candidate);
                    }
                });
            })
        }
    });

    socket.on('offer', description => {
        console.log('request for offer received');
        const peerConnection = new RTCPeerConnection(servers);
        localPeerConnection = peerConnection;
        peerConnection.setRemoteDescription(description).then( a => {
            return peerConnection.createAnswer();
        }).then (sdp => {
            peerConnection.setLocalDescription(sdp);
            socket.emit('answer', peerConnection.localDescription);
        });
        peerConnection.addEventListener('icecandidate', (event) => {
            console.log('ice candidate event triggered');
            const candidate = event.candidate;
            // if (localPeerConnection) {
            //     localPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            // }
            if (candidate) {
                socket.emit('candidate', selfid, candidate);
            }
        });
        peerConnection.addEventListener('track', (event) => {
            console.log('track event received from remote');
            const stream = event.streams[0];
            remoteStream = stream;
            const videoElemtn = document.createElement('video');
            videoElemtn.playsinline = true;
            videoElemtn.autoplay = true;
            const videoContainer = document.getElementById('video-container');
            videoContainer.appendChild(videoElemtn);
            videoElemtn.srcObject = stream;
        });
    });

    socket.on('description', description => {
        if (localPeerConnection) {
            localPeerConnection.setRemoteDescription(description);
        }
    });

    socket.on('candidate', candidate => {
        if (localPeerConnection) {
            localPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });

    socket.on('answer', description => {
        if (localPeerConnection) {
            console.log('answer received');
            localPeerConnection.setRemoteDescription(description);
        }
    });

    // fetch previous users
    fetchUsers();
}

function fetchUsers() {
    socket.emit('fetch-users');
}

function listUsers() {
    const container = document.getElementById('users-list');
    container.innerHTML = '';
    users.forEach(u => {
        const userElement = document.createElement('p');
        const btnElement = document.createElement('button');
        const stopBtnElemtn = document.createElement('button');
        stopBtnElemtn.innerText = 'Stop video-call';
        stopBtnElemtn.onclick = stopUserVideo;
        stopBtnElemtn.setAttribute('data-userid', u);
        btnElement.innerText = 'Start video-call';
        btnElement.setAttribute('data-userid', u);
        btnElement.onclick = startUserVideo;
        // if ( u === selfid) {
        //     btnElement.disabled = true;
        // }
        userElement.innerText = u;
        userElement.appendChild(btnElement);
        userElement.appendChild(stopBtnElemtn);
        container.appendChild(userElement);
    });
}

register();

// video implementation

const videoOptions = {
    video: true
}

const servers = {
    iceServers: [
        {
        urls: 'stun:stun.l.google.com:19302',
        },
    ],
    iceCandidatePoolSize: 10,
};

let localStream;
let localPeerConnection;

let remoteStream;

function startUserVideo(ev) {
    const target = ev.target;
    const dataUserId = target.getAttribute('data-userid');
    const videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.playsinline = true;
    videoElement.id = dataUserId
    const videoContainer = document.getElementById('video-container');
    if (selfid === dataUserId) {
        // means local video
        navigator.mediaDevices.getUserMedia(videoOptions).then(stream => {
            localStream = stream;
            videoElement.srcObject = localStream;
            videoContainer.appendChild(videoElement);
        });
    } else {
        // means remote video
        // establish remote communication now 
        socket.emit('request-offer', selfid);
    }
}

function stopUserVideo(event) {
    const target = event.target;
    const dataUserId = target.getAttribute('data-userid');
    if (selfid === dataUserId) {
        // means local video
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(v => {
            v.stop();
        })
    } else {
        // means streamed video
        socket.emit('stop-video', );
        // const stream = remoteStream;
        // const tracks = stream ? stream.getTracks() : [];
        // if (tracks) {
        //     tracks.forEach(t => t.stop());
        // }
    }
}