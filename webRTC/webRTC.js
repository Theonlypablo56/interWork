import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, getDocs, onSnapshot, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};
const animals = [
  { name: 'Hungry Cat', file: '/animalWebCams/cat_eat.mp4' },
  { name: 'Insane Cat', file: '/animalWebCams/cat_stare.mp4' },
  { name: 'Confused Fish', file: '/animalWebCams/fishy.mp4' },
  { name: 'Hungry Dog', file: '/animalWebCams/chef_dog.mp4' },
  { name: 'Suspicious "rat"', file: '/animalWebCams/rat_stare.mp4' },
  { name: 'Bad Wifi Gerald', file: '/animalWebCams/hampterCall.mp4' }
]
const logSettings = ['connection', 'sessionPeers', 'connectionChange'];
const constraints = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { max: 65, ideal: 60 },
    aspectRatio: {ideal: 16/9}
  },
  audio: {
    sampleSize: 16,
    channelCount: 2,
  }
}
const streamConstraints = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { max: 65, ideal: 60 },
    aspectRatio: {ideal: 16/9}
  },
  audio: {
    sampleSize: 16,
    channelCount: 2,
  }
}

const quickID = (idName) => {
  return document.getElementById(idName); // I got tired ok.
}

const hideSideBar = () => {
  let sideBar = quickID('sideBar');
  sideBar.classList.add('sideBarClosing');
  sideBar.classList.contains('sideBarOpening') ? sideBar.classList.remove('sideBarOpening') : "";

  quickID('settingsBtn').disabled = true;
}
const showSideBar = () => {
  let sideBar = quickID('sideBar');
  if (sideBar.classList.contains('sideBarOpening')) {
    hideSideBar();
    return;
  }
  sideBar.classList.add('sideBarOpening');
  sideBar.classList.contains('sideBarClosing') ? sideBar.classList.remove('sideBarClosing') : "";

  quickID('settingsBtn').disabled = true;
  sideBar.addEventListener('animationend', () => {
    quickID('settingsBtn').disabled = false;
    if (sideBar.classList.contains('sideBarOpening')) {
      sideBar.style.overflow = 'visible';
    }
  });
}

const hideBtmBar = () => {
  let sideBar = quickID('bottomSettingsBar');
  sideBar.classList.add('sideBarClosing');
  sideBar.classList.contains('sideBarOpening') ? sideBar.classList.remove('sideBarOpening') : "";

  quickID('settingsBtn').disabled = true;
}
const showBtmBar = () => {
  let sideBar = quickID('bottomSettingsBar');
  if (sideBar.classList.contains('sideBarOpening')) {
    hideBtmBar();
    return;
  }
  sideBar.classList.add('sideBarOpening');
  sideBar.classList.contains('sideBarClosing') ? sideBar.classList.remove('sideBarClosing') : "";

  quickID('settingsBtn').disabled = true;
  sideBar.addEventListener('animationend', () => {
    quickID('settingsBtn').disabled = false;
    if (sideBar.classList.contains('sideBarOpening')) {
      sideBar.style.overflow = 'visible';
    }
  });
}

const addPeer = (peerInfo) => {
  const peerList = quickID('peerList');
  const peerIndex = peerList.childElementCount + 1;
  if (typeof (peerInfo) != 'string') {
    console.error('peerInfo is not a string');
    return;
  }
  let newPeer = document.createElement('h5');
  newPeer.classList.add('peerItem');
  newPeer.textContent = `o ${peerInfo}`; // ${peerIndex}: //
  peerList.appendChild(newPeer);
  return newPeer;
}

const peerInfoSetup = (peerObj) => {
  if (peerObj.username == user.username) {
    return;
  }
  let peerElem = addPeer(peerObj.username);
  peerObj.element = peerElem;
  onlinePeers.push(peerObj);
  peerElem.onclick = () => {
    peerUsername = peerObj.username;
    peerInfo = retrievePeer(peerObj.username);
    document.querySelectorAll('.selectedPeer').forEach((peerElement) => {
      peerElement.classList.remove('selectedPeer');
    })
    peerElem.classList.add('selectedPeer');
  }
}

const retrievePeer = (peerUsrName) => {
  for (let m = 0; m < onlinePeers.length; m++) {
    if (onlinePeers[m].username === peerUsrName) {
      return onlinePeers[m];
    }
  }
  return null;
}

const peerListZapper = () => {
  document.querySelectorAll('.peerItem').forEach((peerItem) => {
    peerItem.remove();
  });
  onlinePeers = [];
}

const callEnd = async (deletedocument) => {
  user.pc.close();
  user.pc = null;
  for (let m = 0; m < peerConnections.length; m++) {
    if (peerConnections[m].pc){
      peerConnections[m].pc.close();
    }
  }
  peerConnections = [];
  //localStream.getTracks().forEach(track => track.stop());
  //localStream = null;
  onlineBtn.disabled = false;
  if (deletedocument) {
    console.log('Deleting Document.');
    await deleteDoc(doc(db, 'allSessions', 'sessions', currSession, user.username));
    console.log('Deleted Document.');
  }
}
const deleteSelf = async () => {
  let temp = Date.now();
  console.log('Deleting Document.');
  await deleteDoc(doc(db, 'allSessions', 'sessions', currSession, user.username));
  console.log(`Deleted Document. Took ${Date.now() - temp}ms.`);
}

const addPeerCamera = (eventInfo, newPeerInfo, fakeInfo) => {
  const camContainer = document.querySelector('.peerVideos');
  const players = document.querySelectorAll('.SidePlayer');
  let playerCopy = document.querySelector('.SidePlayer.unExist').cloneNode(true);
  let usernameTxt = playerCopy.querySelector('.peerTextOverlay');

  playerCopy.classList.remove('unExist');
  playerCopy.style.order = players.length - 1;
  if (fakeInfo) {
    playerCopy.querySelector('.peerCamVid').muted = true;
    playerCopy.querySelector('.peerCamVid').loop = true;
    let random = Math.floor(Math.random() * animals.length);
    playerCopy.querySelector('.peerCamVid').src = animals[random].file;
    newPeerInfo = {
      username: `${animals[random].name} Number ${players.length}`
    };
    peerInfoSetup(newPeerInfo);
    usernameTxt.textContent = newPeerInfo.username;
    camContainer.appendChild(playerCopy);
    return;
  }
  usernameTxt.textContent = newPeerInfo.username;
  playerCopy.id = `user_${newPeerInfo.username}`;

  playerCopy.querySelector('.peerCamVid').srcObject = eventInfo.streams[0];
  //callBtnTxt.textContent = 'End Call';
  camContainer.appendChild(playerCopy);

  return playerCopy;
}

const addScreenShare = (screenShareStream, sharerInfo) => {
  const camContainer = document.querySelector('.peerVideos');
  const players = document.querySelectorAll('.SidePlayer');
  let playerCopy = document.querySelector('.SidePlayer.unExist').cloneNode(true);
  let usernameTxt = playerCopy.querySelector('.peerTextOverlay');

  playerCopy.classList.remove('unExist');
  playerCopy.style.order = players.length - 1;
  usernameTxt.textContent = sharerInfo.username;

  playerCopy.querySelector('.peerCamVid').srcObject = screenShareStream;
  camContainer.appendChild(playerCopy);
  return playerCopy;
}

const fakeInfoSetup = (ratNumber) => {
  peerInfoSetup({ username: 'Enrique Perez' });
  peerInfoSetup({ username: 'Mariana Villagomez' });
  for (let m = 0; m < ratNumber; m++) {
    addPeerCamera();
  }
}

const waitForPeerInfo = () => {
  return new Promise((resolve, reject) => {
    console.log('waitin for info');
    let temp = setInterval(() => {
      if (peerInfo) {
        clearInterval(temp);
        resolve();
      };
    });
  });
}

const cleanConnectPeerElm = (usrname) => {
  for (let m = 0; m < onlinePeers.length; m++){
    if (onlinePeers[m].username == usrname){
      //onlinePeers[m].element.remove();
      //onlinePeers.splice(m, 1);
      break;
    }
  }
}

const die = () => {
  user.latestVidElm.remove();
} 
const name = () => {
  return user.username;
}

const log = (logInfo, importanceType) => {
  if (logSettings.includes(importanceType)){
    console.log(logInfo);
  }
}

const removePeer = (peerUsrName) => {
  for (let mv = 0; mv < peerConnections.length; mv++){
    if (peerConnections[mv].username == peerUsrName){
      peerConnections[mv].element.remove();
      (peerConnections[mv].pc.connectionState != 'closed') ? peerConnections[mv].pc.close() : '';
      peerConnections.splice(mv, 1);
      break;
    }
  }
}

const getPC = (peerUsrName) => {
  for (let mv = 0; mv < peerConnections.length; mv++){
    if (peerConnections[mv].username == peerUsrName){
      return peerConnections[mv];
    }
  }
}

const roomListener = () => {
  sessionListener = onSnapshot(collection(db, 'allSessions', 'sessions', currSession), (snapShot) => {
    peerListZapper();
    snapShot.forEach((user) => {
      let userData = user.data();
      if (!userData.username) {
        //console.log(`No username found on User: ${userData}`);
        return;
      } else if (userData.username == name()) {
        return;
      }
      log(`${userData.username}: ${userData.session}`, 'sessionPeers');
      peerInfoSetup(userData);
    });
  });
}

const messageHandler = (message, currChannel) => {
  console.log(message);
  // getPC(message.username)
  switch(message?.type){
    case 'disconnect':
      console.log(`${message.username} has Disconnected.`);
      removePeer(message.username);
      break;
    case 'video':
      let senders = getPC(message.username).pc.getSenders();
      localStream.getVideoTracks().forEach((trackVid) => {
        senders.find(e => e.track?.kind === 'video').replaceTrack(trackVid);
      });
      break;
    case 'audio':
      let senderz = getPC(message.username).pc.getSenders();
      localStream.getAudioTracks().forEach((trackAudio) => {
        senderz.find(e => e.track?.kind === 'audio').replaceTrack(trackAudio);
      });
      break;
    default:
      console.log('Unhandled message type.');
  }
}

const frameRateCheck = async () => {
  setTimeout(() => {
    tempo = localStream.getVideoTracks()[0].stats.deliveredFrames;
    setInterval(() => {
      console.log(localStream.getVideoTracks()[0].stats.deliveredFrames - tempo);
      tempo = localStream.getVideoTracks()[0].stats.deliveredFrames;
    }, 1000);
  }, 1000);
}

const deviceLister = async () => {
  const deviceList = await navigator.mediaDevices.enumerateDevices();
  deviceList.forEach((device, index) => {
    let option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `${device.kind}: ${index}`;
    if (device.kind === 'audioinput'){
      audioDropdown.appendChild(option);
    } else if (device.kind === 'videoinput'){
      cameraDropdown.appendChild(option);
    }
    //console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
  });
}

const deviceDropHandler = async (type) => {
  const audioSource = audioDropdown.value;
  const videoSource = cameraDropdown.value;
  constraints.video.deviceId = videoSource ? { exact: videoSource } : undefined;
  constraints.audio.deviceId = audioSource ? { exact: audioSource } : undefined;

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    let newTrack;
    localStream.getTracks().forEach((track) => {
      if (track.kind == 'video' && type == 'video'){
        track.stop();
        localStream.removeTrack(track);
        log(`Removed ${track.label}`, 'settings');
      } else if (track.kind == 'audio' && type == 'audio'){
        track.stop();
        localStream.removeTrack(track);
        log(`Removed ${track.label}`, 'settings');
      }
    });
    stream.getTracks().forEach((track) => { // Put tracks into peer connection
      if (track.kind == type){
        localStream.addTrack(track);
        user.pc.addTrack(track, localStream);
        newTrack = track;
      }
    });
    webcamVideo.srcObject = localStream;
    updatePeerDevices(newTrack);
  });
}

const updatePeerDevices = async (newTrack) => {
  for (let mv = 0; mv < peerConnections.length; mv++){
    if (newTrack.kind == 'video'){
      peerConnections[mv].pc.getSenders().find(e => e.track?.kind === 'video').replaceTrack(newTrack).then(() => {
        log(`Replaced ${peerConnections[mv].username}'s video track.`, 'connectionChange');
      });
    } else if (newTrack.kind == 'audio'){
      peerConnections[mv].pc.getSenders().find(e => e.track?.kind === 'audio').replaceTrack(newTrack).then(() => {
        log(`Replaced ${peerConnections[mv].username}'s audio track.`, 'connectionChange');
      });
    }
  }
}

const connectToSession = async () => {
  if (!peerConnections){
    log("No peers in session to connect to.", 'connection');
    return;
  }
  log(`Starting session connection process. ${onlinePeers.length} peers to connect to.`, 'connection');
  let peerNum = onlinePeers.length;
  for (let m = 0; m < onlinePeers.length; m++) {
    if (onlinePeers[m].username == name()) {
      continue;
    }
    peerUsername = onlinePeers[m].username;
    peerInfo = retrievePeer(peerUsername);
    log(`Attempting connection to ${peerUsername}.`, 'connection');
    user.time = Date.now();
    await user.answerSetup();
  }
}

class userConnect {
  constructor(username, session, peerIceCandids) {
    this.username = username;
    this.userDoc = null;
    this.session = session;
    this.offerSDP = null;
    this.answerSDP = null;
    this.iceCandidates = [];
    this.peerIceCandids = peerIceCandids;
    this.pc = new RTCPeerConnection(servers);
    this.channel = null;
    this.listeners = [];
    this.snapshotListener = null; // main firestore listener
    this.userInfo = {};
    this.time;
    this.latestVidElm;
  }
  connectionSetup = async () => {
    if (this.userInfo.offerSDP) {
      this.resetInfo();
    }
    this.connectionListener();
    this.iceCandidListener();
    this.channelSetup();
    let offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.candidGather();
    this.userInfo = {
      username: this.username,
      session: currSession,
      currentPeer: null,
      offerSDP: offer.sdp,
      answerSDP: "",
      iceCandidates: this.iceCandidates,
      peerIceCandids: ""
    };
    let usrDoc = await doc(db, 'allSessions', 'sessions', currSession, this.username);
    this.userDoc = usrDoc;
    await setDoc(usrDoc, this.userInfo);
    this.userDataListener();
    onlinePeers.push(this.userInfo);
    this.pc.addEventListener('track', (e) => {
      this.latestVidElm = addPeerCamera(e, peerInfo);
    }, { once: true });
    return 'Finished :>';
  }
  answerSetup = async () => {
    log('Answer Setup', 'connection');
    if (!peerUsername) {
      console.log('No peer selected');
      return;
    }
    this.resetInfo();

    peerDoc = await doc(db, 'allSessions', 'sessions', currSession, peerUsername);

    this.iceCandidListener();
    await this.pc.setRemoteDescription({ type: "offer", sdp: peerInfo.offerSDP }); // peerInfo Comes from the selection of a peer
    
    this.channelSetup(peerInfo);
    let answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.candidGather();
    this.userInfo.answerSDP = answer.sdp;
    
    peerConnections.push({ pc: this.pc, channel: this.channel, username: peerUsername, element: this.latestVidElm, listeners: this.listeners });

    await updateDoc(peerDoc, { "answerSDP": answer.sdp, "peerIceCandids": this.iceCandidates, currentPeer: this.userInfo });
    if (peerInfo.iceCandidates) {
      for (let m = 0; m < peerInfo.iceCandidates.length; m++) {
        this.pc.addIceCandidate(peerInfo.iceCandidates[m]);
        this.userInfo.peerIceCandids = peerInfo.iceCandidates;
      }
    }
    return 'Finished :>';
  }
  offerSetup = async () => {
    log('Offer Setup', 'connection');
    this.resetInfo();

    this.iceCandidListener();
    let offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.candidGather();
    this.userInfo = {
      username: this.username,
      session: currSession,
      currentPeer: null,
      offerSDP: offer.sdp,
      answerSDP: "",
      iceCandidates: this.iceCandidates,
      peerIceCandids: ""
    };
    let usrDoc = await doc(db, 'allSessions', 'sessions', currSession, this.username);
    this.userDoc = usrDoc;
    await setDoc(usrDoc, this.userInfo);
    onlinePeers.push(this.userInfo);
    //this.channelSetup();
  }
  iceCandidListener = () => {
    this.pc.onicecandidate = e => {
      const message = {
        type: 'candidate',
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        this.iceCandidates.push(message);
      }
    }
  }
  candidGather = () => {
    return new Promise((resolve, reject) => {
      this.pc.onicegatheringstatechange = (e) => {
        if (this.pc.iceGatheringState === 'complete') {
          log('ICE gathering complete.', 'connection');
          resolve();
        }
      }
    });
  }
  userDataListener = () => {
    let unsub = onSnapshot(this.userDoc, (doc) => {
      let currData = doc.data();
      if (!currData) { unsub(); return;}
      log(`${user.username}'s document has been changed.`, 'connection');
      if (currData.currentPeer) {
        peerConnections.push({ pc: this.pc, channel: this.channel, username: currData.currentPeer.username, element: this.latestVidElm, listeners: this.listeners });
        peerInfo = currData.currentPeer;
        peerUsername = currData.currentPeer.username;
        log('Peer Connection added', 'connection');
      }
      if (currData.answerSDP && (currData.answerSDP != this.userInfo.answerSDP)) {
        this.pc.setRemoteDescription({ type: "answer", sdp: currData.answerSDP });
        this.userInfo.answerSDP = currData.answerSDP;
        log('Setting Answer as Remote Description.', 'connection');
      }
      if (currData.peerIceCandids && (currData.peerIceCandids != this.userInfo.peerIceCandids)) {
        log('Adding ice candidates', 'connection');
        for (let m = 0; m < currData.peerIceCandids.length; m++) {
          this.pc.addIceCandidate(currData.peerIceCandids[m]);
          this.userInfo.peerIceCandids = currData.peerIceCandids;
        }
      }
    });
    this.snapshotListener = unsub;
  }
  connectionListener = () => {
    this.pc.addEventListener('connectionstatechange', (e) => {
      switch (this.pc.connectionState) {
        case 'new':
          this.time = Date.now();
          log(`Discovered ${peerUsername} Connection.`, 'connection');
        case 'connecting':
          if (!this.time) { this.time = Date.now(); }
            log(`Connecting to ${peerUsername}, ${Date.now() - this.time}ms since discovery.`, 'connection');
          break;
        case 'connected':
          log(`Connected to ${peerUsername}, Took ${Date.now() - this.time}ms to connect.`, 'connection');
          this.pc.oniceconnectionstatechange = (e) => {
            if(true) {
              die(); //this.latestVidElm.remove();
              this.pc.close();
              log(`Connection with ${peerUsername} disconnected., Connection lasted ${(Date.now() - this.time) / 1000} seconds.`, 'connection');
            }
          }
          cleanConnectPeerElm(peerUsername);
          this.offerSetup();
          break;
        case 'disconnected':
          this.latestVidElm.remove();
          this.pc.close();
          log(`Connection with ${peerUsername} disconnected. Connection lasted ${(Date.now() - this.time) / 1000} seconds.`, 'connection');
          break;
        case 'failed':
          console.error('Connection failed');
          break;
        default:
          console.log('Unknown Connection State. Probably not good.');
      }
    });
  }
  channelSetup = (peer_Info) => {
    log('Creating Data Channel', 'channel');
    try {
      this.channel = this.pc.createDataChannel(this.username,{negotiated: true, id: 27}); // {negotiated: true, id: 2756}
    } catch (err) {
      console.log(err);
      return;
    }
    this.channel.onopen = (e) => {
      log('Channel is open', 'channel');
      this.channel.send(JSON.stringify({type: 'username', username: this.username}));
    }
    this.channel.onmessage = (e) => {
      log(`From: ${peer_Info?.username}, ${e.data}`, 'connection');
      messageHandler(JSON.parse(e.data), this.channel);
    }
    this.channel.onclose = (e) => {
      log('Channel is closed', 'channel');
    }
    this.channel.onerror = (e) => {
      console.log(`Error: ${e}`);
    }
  }
  resetInfo = () => {
    if (!this.userInfo.answerSDP && this.pc) {
      this.pc.close();
      console.log('Closing unused connection.');
    }
    this.iceCandidates = [];
    this.peerIceCandids = [];
    this.listeners = [];
    this.pc = new RTCPeerConnection(servers);
    this.userInfo = {
      username: this.username,
      session: currSession,
      currentPeer: null,
      offerSDP: null,
      answerSDP: "",
      iceCandidates: null,
      peerIceCandids: ""
    };
    localStream.getTracks().forEach((track) => { // Put tracks into new peer connection
      this.pc.addTrack(track, localStream);
    });
    this.connectionListener();
    this.pc.addEventListener('track', (e) => {
      this.latestVidElm = addPeerCamera(e, peerInfo);
    }, { once: true });
    log('Resetting old connection info.', 'connection');
  }
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let peerConnections = []; // peerInfo objects
const webcamVideo = quickID('hostCamVid');
let screenShareVideo;
let localStream = null, screenStream = null;
let online = false;

const camBtn = quickID('startCamBtn');
const shareBtn = quickID('screenShareBtn');
const onlineBtn = quickID('onlineBtn');
const leaveRoomBtn = quickID('leaveRoomBtn');
const usernameInput = quickID('usernameInput');
const passwordInput = quickID('passwordInput');
const roomInput = quickID('roomInput');
const cameraDropdown = quickID('cameraDropdown');
const audioDropdown = quickID('micDropdown')
let currSession = "fnaf_roleplay";
let sessionListener = null;
let onlinePeers = [];
let user = new userConnect('', currSession, null);
let peerUsername = null;
let peerInfo = null;
let peerDoc = null;

//quickID('sideOpenBtn').addEventListener('click', showSideBar);
//quickID('sideCloseBtn').addEventListener('click', hideSideBar);
quickID('settingsBtn').addEventListener('click', showBtmBar);
quickID('sideCloseBtn').addEventListener('click', hideBtmBar);
usernameInput.value = '';
roomInput.value = '';
//fakeInfoSetup(6);

camBtn.onclick = async () => {
  let camOnSvg = 'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z';
  let camOffSvg = 'M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z';
  if (peerConnections.length){
    for (let mv = 0; mv < peerConnections.length; mv++){
      let senders = peerConnections[mv].pc.getSenders();
      localStream.getVideoTracks().forEach((trackVid) => {
        senders.find(e => e.track?.kind === 'video').replaceTrack(trackVid);
      });
      localStream.getAudioTracks().forEach((trackAud) => {
        senders.find(e => e.track?.kind === 'audio').replaceTrack(trackAud);
      });
    }
  }
  if (webcamVideo.srcObject) {
    localStream.getTracks().forEach((track) => { // Stop video cam
      track.stop();
    });
    webcamVideo.srcObject = null;
    camBtn.querySelector('path').setAttribute('d', camOnSvg);
    onlineBtn.disabled = true;
    return;
  }
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints); // need to add a fail system if await takes too long {video: true, audio: true}
  } catch (err){
    console.log(err);
    return;
  }
  localStream.getTracks().forEach((track) => { // Put tracks into peer connection
    user.pc.addTrack(track, localStream);
    if (track.kind == 'video') {
      cameraDropdown.value = track.getSettings().deviceId;
      constraints.video.deviceId = {exact: track.getSettings().deviceId};
    } else if (track.kind == 'audio') {
      audioDropdown.value = track.getSettings().deviceId;
      constraints.audio.deviceId = {exact: track.getSettings().deviceId};
    }
  });
  deviceLister();
  webcamVideo.srcObject = localStream; // show webcam video
  if (user.username && currSession) {
    onlineBtn.disabled = false;
  }
  //frameRateCheck();
  camBtn.querySelector('path').setAttribute('d', camOffSvg);
}
let tempo = 0;
shareBtn.onclick = async () => {
  const path = shareBtn.querySelector('path');
  const shareSVG = 'M440-320h80v-166l64 63 57-57-161-160-160 160 57 56 63-63v167ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z';
  const stopSVG = 'm376-320 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z';
  if (screenStream) {
    screenStream.getTracks().forEach((track) => { // Stop video cam
      track.stop();
      screenStream.removeTrack(track);
    });
    screenShareVideo.srcObject = null;
    screenShareVideo.remove();
    path.setAttribute('d', shareSVG);
    path.style.fill = '#e8eaed';
    screenStream = null;
    return;
  }
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
  } catch (err){
    console.log(err);
    return;
  }
  screenStream.getTracks().forEach((track) => { // Put tracks into peer connection
    user.pc.addTrack(track, screenStream);
  });
  screenShareVideo = addScreenShare(screenStream, user.username);
  path.setAttribute('d', stopSVG);
  path.style.fill = '#FF0000';
  //frameRateCheck();
}

onlineBtn.onclick = async () => {
  if (!user.username || !currSession || !localStream) {
    console.log('No username or session or stream');
    return;
  }
  if (online) {
    sessionListener();
    if (user.pc) {
      user.snapshotListener();
      peerConnections.forEach((peer) => {
        try {
          peer.channel.send(JSON.stringify({type: 'disconnect', username: user.username}));
          document.querySelector(`#user_${peer.username}`) ? document.querySelector(`#user_${peer.username}`).remove() : '';
          peer.pc.close();
        } catch (err) {
          console.log(err);
        }
      });
      deleteSelf();
    }
    online = false;
    onlineBtn.querySelector('h6').textContent = 'Go Online';
    leaveRoomBtn.disabled = true;
    usernameInput.disabled = false;
    return;
  }
  roomListener();
  await user.connectionSetup();
  onlineBtn.querySelector('h6').textContent = 'Go Offline';
  online = true;
  leaveRoomBtn.disabled = false;
  usernameInput.disabled = true;
  connectToSession();
}

leaveRoomBtn.onclick = async () => {
  peerConnections.forEach((peer) => {
    try {
      peer.channel.send(JSON.stringify({type: 'disconnect', username: user.username}));
      peer.pc.close();
    } catch (err) {
      console.log(err);
    }
  });
  deleteSelf();
  peerConnections = [];
  leaveRoomBtn.disabled = true;
}

usernameInput.oninput = () => {
  let check = document.querySelector('.inputCheck.check');
  let nuhUh = document.querySelector('.inputCheck.close');
  if (!usernameInput.value.length) { usernameInput.style.color = '#e8eaed'; return; }
  for (let m = 0; m < onlinePeers.length; m++) {
    if (onlinePeers[m].username == usernameInput.value) {
      usernameInput.style.color = '#ff0000';
      return;
    } else {
      usernameInput.style.color = '#167343';
    }
  }
  //check.style.visibility = 'visible';
  //check.style.width = `calc(70% + ${usernameInput.length}ch)`;
  if (!onlinePeers.length) {
    usernameInput.style.color = '#167343';
  }
}
usernameInput.onchange = () => {
  if (!usernameInput.value.length) { usernameInput.style.color = '#e8eaed'; return; }
  for (let m = 0; m < onlinePeers.length; m++) {
    if (onlinePeers[m].username == usernameInput.value) {
      console.log('Username already taken');
      return;
    }
  }

  let username = usernameInput.value;
  user.username = username;
  if (localStream && currSession) {
    onlineBtn.disabled = false;
  }
  usernameInput.style.color = '#167343';
  quickID('hostNameOverlay').textContent = user.username;
}

roomInput.onchange = () => {
  currSession = roomInput.value;
  user.session = currSession;
  if (localStream && user.username.length) {
    onlineBtn.disabled = false;
  }
}


cameraDropdown.onchange = async () => {
  if (!localStream){
    await navigator.mediaDevices.getUserMedia();
    deviceLister();
  }
  deviceDropHandler('video');
}

audioDropdown.onchange = async () => {
  if (!localStream){
    await navigator.mediaDevices.getUserMedia();
    deviceLister();
  }
  deviceDropHandler('audio');
}

document.querySelector('.micIcon').onclick = () => {
  let path = document.querySelector('.micIcon').querySelector('path');
  let path_d = path.getAttribute('d');
  const micOn = 'M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z'
  const micOff = 'm710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z';
  if (path_d == micOn) {
    path.setAttribute('d', micOff);
  } else {
    path.setAttribute('d', micOn);
  }
}
const divOutliner = () => {
  let all = document.getElementsByTagName("*");
  console.log(all.length);
  for (let m = 0; m < all.length; m++) {
    let randomColor = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
    all[m].style.outline = `1px solid ${randomColor}`
  }
}
//divOutliner();


/*
const available = onSnapshot(collection(db, 'allSessions', 'sessions', currSession), (snapShot) => {
  peerListZapper();
  snapShot.forEach((user) => {
    let userData = user.data();
    if (!userData.username) {
      //console.log(`No username found on User: ${userData}`);
      return;
    } else if (userData.username == name()) {
      return;
    }
    log(`${userData.username}: ${userData.session}`, 'sessionPeers');
    peerInfoSetup(userData);
  });
});
*/

//addPeer('Pablo Martinez');
//addPeer('Mariposa Carmesí');

/*peerUsername
const querySnapshot = await getDocs(collection(db, 'allSessions', 'sessions', currSession));
if (querySnapshot.size == 0){
  let aDocument = await doc(db, 'allSessions', 'sessions', currSession, 'Bob Esponja');
  await setDoc(aDocument, {name: 'Bob Esponja', pendejo: 'si'});
}
console.log(querySnapshot.size);
querySnapshot.forEach((doc) => {
  console.log(doc.id);
  console.log(doc.data());
});

const docRef = await addDoc(collection(db, "users"), {
  first: "Pablo",
  last: "Martinez",
  born: 2006
});
const querySnapshot = await getDocs(collection(db, "users"));

querySnapshot.forEach((doc) => {
  console.log(`${doc.id} => ${doc.data()}`);
  console.dir(doc.data());
});
*/
