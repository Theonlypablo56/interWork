let computer = true;
const MediaBox = document.getElementById("MainMediaBox");
let stylesheet = document.getElementById('stylesheet');
const defaultSettings = {debug: true, ratio:'16:9'};
let checks = true;
let dragEvent = false;
let img = document.createElement('img');
let players = [];

const vidIDGrabber = (link) => {
  let videoID = "";

  if (typeof link !== "string"){
    console.log(`Inputted link was not a String, instead was a ${typeof link}`);
    return;
  }

  const check1 = link.indexOf("?v=");
  const check2 = link.indexOf("?si=");
  const check3 = link.indexOf("/embed/");
  let start, end;

  switch (true){
    case (check1 > 11 && !(check3 > 11)):   // Regular YT link check.
      videoID = link.substring(check1 + 3);
      break;
    case (check2 > 11):                     // YT share link check (have to add cutoff in case "start at #" checkbox is clicked).
      start = link.indexOf(".be/") + 4;
      end = check2;
      videoID = link.substring(start, end);
      break;
    case (check3 > 11 && check1 > 11):      // YT embed link check in case kenneth decides to use one again.
      start = check3 + 7;
      end = check1;
      videoID = link.substring(start, end);
      break;
    case (check3 > 11):                     // YT embed link check in case kenneth decides to use one again.
      start = check3 + 7;
      videoID = link.substring(start);
      break;
    default:                                // Just a regular Error message.
      console.log(`Youtube link not recognized, ${check1}, ${check2}, ${check3}`);
      return false;
  }
  return videoID;
}

const iframeCheck = (idOrSelector) => {
  let iframeRoot = (typeof idOrSelector == 'string') ? document.querySelector(idOrSelector) : idOrSelector;
  let iframe = iframeRoot.querySelector('iframe');
  if (!iframe){
    let newIframe = document.createElement('iframe');
    newIframe.className = 'youtube_Iframe';
    iframeRoot.append(newIframe);
    //console.log("Iframe didn't exist, but now exists");
    return newIframe;
  }
}

const typeCheck = (variable, expectedType, expectedType2) => {
  // "object" "undefined" "boolean"	"number" "string"	
  if ((typeof variable == expectedType || typeof variable == expectedType2) && checks == true){
    checks = true; 
    return;
  }
  console.log(`Expected ${expectedType}, Instead got ${variable}`);
  // if any check fails then it globally puts the check variable as false which allows multiple checks easily, 
  //  similar to those tilt sensors some packages have.
  checks = false; 
}

const quickID = (idName) => {
  return document.getElementById(idName); // I got tired ok.
}

const plyrInputLinker = (plyrObj, inputElement) => {
  inputElement.addEventListener("change", () => {
    //console.log(inputElement.value);
    if (inputElement.value.includes("delete")){plyrObj.inputElement.parentElement.remove()}

    let vidId = vidIDGrabber(inputElement.value); 
    if (!vidId){
      let cache = inputElement.style.color; // Very primitive bad link response, WILL CHANGE LATER.
      inputElement.style.color = 'red';
      setTimeout(() => {inputElement.style.color = cache}, 1000);
      return;
    }

    plyrObj.plyr.source = {
      type: 'video',
      sources: [
        {
          src: vidId,
          provider: 'youtube',
        },
      ],
    };
  });
  plyrObj.inputElement = inputElement;
}

const showInput = (plyrObj) => {
  let inputElement = plyrObj.inputElement;
  let classList = inputElement.classList;

  inputElement.classList.add('inputDropAnim');
  classList.contains('inputDropAnim_reversed') ? inputElement.classList.remove('inputDropAnim_reversed') : "";

  inputElement.addEventListener('animationend', () => {
    inputElement.classList.remove('inputDropAnim');
  });
  console.log('paused');
}

const hideInput = (plyrObj) => {
  let inputElement = plyrObj.inputElement;
  let classList = inputElement.classList;

  inputElement.classList.add('inputDropAnim_reversed');
  classList.contains('inputDropAnim') ? inputElement.classList.remove('inputDropAnim') : "";

  console.log('playing');
}

const hideSideBar = () => {
  let sideBar = quickID('sideBar');
  sideBar.classList.add('sideBarClosing');
  sideBar.classList.contains('sideBarOpening') ? sideBar.classList.remove('sideBarOpening') : "";

  quickID('sideOpenBtn').disabled = true;
}

const showSideBar = () => {
  let sideBar = quickID('sideBar');
  if (sideBar.classList.contains('sideBarOpening')){
    hideSideBar();
    return;
  }
  sideBar.classList.add('sideBarOpening');
  sideBar.classList.contains('sideBarClosing') ? sideBar.classList.remove('sideBarClosing') : "";
  
  quickID('sideOpenBtn').disabled = true;
  sideBar.addEventListener('animationend', () => {
    quickID('sideOpenBtn').disabled = false;
    if (sideBar.classList.contains('sideBarOpening')){
      sideBar.style.overflow = 'visible';
    }
  });
}

const firefoxClientPos = () => {
  if (!dragEvent){
    window.addEventListener('dragover', (e) => {
      dragEvent = e;
    });
  }
}

const dragListener = () => { // Weird way for firefox
  let allBoxes = document.querySelectorAll('.emptyPlyrBox');
  let dropZones = document.querySelectorAll('.editableRow');
  if (computer){
    allBoxes.forEach((box) => { boxDrag(box); });
  } else {
    allBoxes.forEach((box) => { boxDragMobile(box); });
  }
  /*
  dropZones.forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      console.log('DRAGGED OVER');
      e.preventDefault();
      //row.classList.add('shadowGlow');
    });
  });
  */
}

const boxDrag = (box) => {
  let editableRows = document.querySelectorAll('.editableRow');
  let mouseX, mouseY;
  let boxRect = box.getBoundingClientRect();
  let boxWidth = boxRect.right - boxRect.left;
  let boxHeight = boxRect.bottom - boxRect.top;
  firefoxClientPos();
  box.addEventListener('dragstart', (e) => {
    box.classList.add('dragging');
    box.style.zIndex = '10';
    e.dataTransfer.setDragImage(img, 0, 0);
    editableRows.forEach((row) => {
      row.classList.add('shadowGlow'); // TEMPORARY
    });
  });

  box.addEventListener('drag', (e) => {
    e.preventDefault();
    mouseX = dragEvent.clientX, mouseY = dragEvent.clientY;
    console.log(`x: ${mouseX}, y: ${mouseY}`);
    box.style.position = 'absolute';
    box.style.left = `calc(${mouseX}px - ${boxWidth/2}px)`;
    box.style.top = `calc(${mouseY}px - ${boxHeight}px)`;
  });

  box.addEventListener('dragend', (e) => {
    box.classList.remove('dragging');
    box.classList.add('fadeAway');
    box.addEventListener('animationend', () => {
      editableRows.forEach((row) => {
        row.classList.remove('shadowGlow'); // TEMPORARY
      });
      box.remove();
      addEmptyBox();
    });
    let currPos = {x: mouseX, y: mouseY};
    let closest = findClosestElem(getPlayerDiv(currPos), currPos);
    if (closest){
      insertPlyr(closest);
    }
  });
}

const boxDragMobile = (box) => {
  let editableRows = document.querySelectorAll('.editableRow');
  let boxRect, boxWidth, boxHeight;
  let mouseX, mouseY;
  box.addEventListener('touchstart', (e) => {
    boxRect = box.getBoundingClientRect();
    boxWidth = boxRect.right - boxRect.left;
    boxHeight = boxRect.bottom - boxRect.top;
    box.classList.add('dragging');
    editableRows.forEach((row) => {
      row.classList.add('shadowGlow'); // TEMPORARY
    });
  });

  box.addEventListener('touchmove', (e) => {
    e.preventDefault();
    mouseX = e.touches[0].clientX, mouseY = e.touches[0].clientY;
    console.log(`x: ${mouseX}, y: ${mouseY}`);
    //console.log(`x: ${mouseX}, y: ${mouseY}`);
    box.style.position = 'absolute';
    box.style.zIndex = '10';
    box.style.left = `calc(${mouseX}px - ${Math.floor(boxWidth)/2}px)`;
    box.style.top = `calc(${mouseY}px - ${boxHeight*2}px)`;
  });

  box.addEventListener('touchend', (e) => {
    box.classList.remove('dragging');
    box.classList.add('fadeAway');
    box.addEventListener('animationend', () => {
      editableRows.forEach((row) => {
        row.classList.remove('shadowGlow'); // TEMPORARY
      });
      box.remove();
      addEmptyBox();
    });
    let currPos = {x: mouseX, y: mouseY};
    let closest = findClosestElem(getPlayerDiv(currPos), currPos);
    if (closest){
      insertPlyr(closest);
    }
  });
}

const addEmptyBox = () => {
  let box = document.getElementsByClassName('emptyPlyrBox')[2];
  let boxesBox = document.getElementsByClassName('dropOvrflw')[0];
  let newBox = box.cloneNode(true);
  boxesBox.appendChild(newBox);
  boxDrag(newBox);
}

const findClosestElem = (elementArray, currPos) => {
  if (!elementArray){
    return false;
  }
  const currX = currPos.x, currY = currPos.y;
  const len = elementArray.length;
  let closestElem = {elem: null, direction: null, xDist : 5000};
  for (let m = 0; m < len; m++){
    const elemBox = elementArray[m].getBoundingClientRect();
    const leftDist = Math.abs(elemBox.left - currX), rightDist = Math.abs(elemBox.right - currX);
    let closest, direction;
    if (leftDist < rightDist){
      closest = leftDist;
      direction = 'left';
    } else {
      closest = rightDist;
      direction = 'right';
    }
    if (closest < closestElem.xDist){
      closestElem.elem = elementArray[m];
      closestElem.xDist = closest;
      closestElem.direction = direction;
    }
  }
  return closestElem;
}

const getPlayerDiv = (currPos) => {
  const currX = currPos.x, currY = currPos.y;
  let editableDiv = false;
  
  const allDivs = document.elementsFromPoint(currX, currY);
  allDivs.forEach((div) => {
    if (div.classList.contains('editableRow')){
      editableDiv = div.children;
    }
  });
  return editableDiv;
}

const insertPlyr = (nearElmObj) => {
  let parent = nearElmObj.elem.parentElement;

  let sidePlayer = document.createElement('div');
  sidePlayer.classList.add('SidePlayer');
  //sidePlayer.style.width = nearElmObj.elem.style.width;

  let plyr = document.createElement('div');
  sidePlayer.appendChild(plyr);
  
  let newPlyr = new ytPlayer(plyr, "https://www.youtube.com/watch?v=-oyqNzNxLhk", defaultSettings);
  newPlyr.generalSetup();

  let oldOrder = Number(nearElmObj.elem.style.order);
  let direction = nearElmObj.direction;
  let newOrder = (direction == 'left') ? oldOrder - 1 : oldOrder + 1;
  sidePlayer.style.order = newOrder;
  orderShifter(parent, newOrder, direction);
  
  parent.appendChild(sidePlayer);
}

const orderShifter = (parent, order, direction) => {
  let allChildren = parent.children;
  let len = allChildren.length;
  for (let m = 0; m < len; m++){
    let currOrder = Number(allChildren[m].style.order);
    if (direction == 'left' && currOrder <= order){
      allChildren[m].style.order = currOrder - 1;
    } else if (direction == 'right' && currOrder >= order){
      allChildren[m].style.order = currOrder + 1;
    }
  }
}

const playerSwapMode = (mainPlyr, sidePlyrs) => {
  sidePlyrs.forEach((plyr) => {
    //plyr.plyr.toggleControls(true);
    let overlayDiv = document.createElement('div');
    overlayDiv.classList.add('clickOverlay');
    plyr.parent.appendChild(overlayDiv);
    overlayDiv.addEventListener('click', () => {
      mainPlyr.swapLinks(plyr, {mainAutoPlay: true});
    });
  });
}

const foxLinkConvert = (vidLink) => {
  //https://www.foxsports.com/watch/fmc-vjuje5nilsxo1yn7 => https://statics.foxsports.com/static/orion/player-embed.html?id=fmc-fulqr0413n0rgej9

  let videoID = vidLink.substring(vidLink.indexOf('fmc-'));
  return `https://statics.foxsports.com/static/orion/player-embed.html?id=${videoID}`;
}

const divOutliner = () => {
  let all = document.getElementsByTagName("*");
  console.log(all.length);
  for (let m=0; m < all.length; m++) {
    let randomColor = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
    all[m].style.outline = `1px solid ${randomColor}`
  }
}


class ytPlayer {
  constructor(divElement, vidSrc, vidSettings){
    this.parent = divElement.parentElement; // should be "SidePlayer"
    this.plyrElm = divElement; // probably is some form of "SidePlayer#"
    this._src = vidSrc; // should be a link
    this.iFrame = iframeCheck(divElement); // iframe element
    this.iFrame.src = vidSrc;
    this.settings = vidSettings; // should be an object
    this.plyr = new Plyr(divElement, vidSettings); // should be a Plyr object
    this.inputElement = "Nuthin"; // should/will be an input element
  }
  inputSetup(){
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = 'Input a Youtube Link';
    this.inputElement.classList.add('videoLinkInput');
    this.parent.appendChild(this.inputElement);
    this.inputElement.addEventListener("change", () => {
      if (this.inputElement.value.includes("delete")){
        this.delete();
        return;
      }
      let vidId = vidIDGrabber(this.inputElement.value); 
      if (!vidId){
        let cache = this.inputElement.style.color; // Very primitive bad link response, WILL CHANGE LATER.
        this.inputElement.style.color = 'red';
        setTimeout(() => {this.inputElement.style.color = cache}, 1000);
        return;
      }
  
      this.plyr.source = {
        type: 'video',
        sources: [
          {
            src: vidId,
            provider: 'youtube',
          },
        ],
      };
    });
  }
  inputLinker (inputElement){
    this.inputElement = inputElement;
    this.inputElement.addEventListener("change", () => {
      if (inputElement.value.includes("delete")){plyrObj.inputElement.parentElement.remove()}
  
      let vidId = vidIDGrabber(this.inputElement.value); 
      if (!vidId){
        let cache = this.inputElement.style.color; // Very primitive bad link response, WILL CHANGE LATER.
        inputElement.style.color = 'red';
        setTimeout(() => {this.inputElement.style.color = cache}, 1000);
        return;
      }
  
      this.plyr.source = {
        type: 'video',
        sources: [
          {
            src: vidId,
            provider: 'youtube',
          },
        ],
      }
    });
  }
  _showInput(){
    let classList = this.inputElement.classList;
  
    this.inputElement.classList.add('inputDropAnim');
    classList.contains('inputDropAnim_reversed') ? this.inputElement.classList.remove('inputDropAnim_reversed') : "";
  
    this.inputElement.addEventListener('animationend', () => {
      this.inputElement.classList.remove('inputDropAnim');
    });
  }
  _hideInput(){
    let classList = this.inputElement.classList;

    this.inputElement.classList.add('inputDropAnim_reversed');
    classList.contains('inputDropAnim') ? this.inputElement.classList.remove('inputDropAnim') : "";
  }
  playPauseListeners(){
    this.plyr.on("play", () => {
      this._hideInput();
      this.parent.querySelector('.plyr__poster').style.opacity = 0;
    });
    this.plyr.on("pause", () => {this._showInput()});
  }
  generalSetup(){
    this.inputSetup();
    this.playPauseListeners();
  }
  delete(){
    this.parent.remove();
  }
  set src(ytLink){
    let vidLink = vidIDGrabber(ytLink);
    if (!vidLink){
      console.log("Invalid Youtube Link");
      return;
    }
    this._src = ytLink;
    this.plyr.source = {
      type: 'video',
      sources: [
        {
          src: vidLink,
          provider: 'youtube',
        },
      ],
    }
  }
  get src(){
    return this._src;
  }
  swapLocation(plyrDiv){
    let newOrder = plyrDiv.style.order;
    let newRow = plyrDiv.parentElement;
    let newWidth = plyrDiv.style.width;

    let oldOrder = this.parent.style.order;
    let oldRow = this.parent.parentElement;
    let oldWidth = this.parent.style.width;

    this.parent.style.order = newOrder;
    this.parent.style.width = newWidth; // In order to put cover back plyr__poster Opacity
    newRow.appendChild(this.parent); //  should be reset to 1.

    plyrDiv.style.order = oldOrder;
    plyrDiv.style.width = oldWidth;
    oldRow.appendChild(plyrDiv);
  }
  swapPlyrs(plyrObj){
    const currTime = [this.plyr.currentTime, plyrObj.plyr.currentTime];
    const currStatus = [this.plyr.playing, plyrObj.plyr.playing];
    let plyrParent = plyrObj.parent;
    let newOrder = plyrParent.style.order;
    let newRow = plyrParent.parentElement;
    let newWidth = plyrParent.style.width;

    let oldOrder = this.parent.style.order;
    let oldRow = this.parent.parentElement;
    let oldWidth = this.parent.style.width;

    this.parent.style.order = newOrder;
    this.parent.style.width = newWidth; // In order to put cover back plyr__poster Opacity
    this.plyr.pause();
    newRow.appendChild(this.parent); //      should be reset to 1.

    plyrObj.parent.style.order = oldOrder;
    plyrObj.parent.style.width = oldWidth;
    plyrObj.plyr.pause();
    oldRow.appendChild(plyrParent);

    console.clear();
    console.log(this.plyr);

    setTimeout(() => {
      console.log('wah');
      this.plyr.currentTime = currTime[0];
      this.parent.querySelector('.plyr__poster').style.opacity = 1;
      if (currStatus[0]){this.plyr.play();}
      console.log(this.plyr.playing);

      plyrObj.plyr.currentTime = currTime[1];
      plyrObj.parent.querySelector('.plyr__poster').style.opacity = 1;
      if (currStatus[1]){plyrObj.plyr.play();}
    }, 250);
  }
  swapLinks(plyrObj, settings = {keepPlayState: false, mainVidKeep: false, mainAutoPlay: false, performanceCheck: false}) {
    const oldLink = this.src, newLink = plyrObj.src;
    const currTime = [this.plyr.currentTime, plyrObj.plyr.currentTime];
    const currStatus = [this.plyr.playing, plyrObj.plyr.playing];
    const currVolume = [this.plyr.volume, plyrObj.plyr.volume];
    this.src = newLink;
    plyrObj.src = oldLink;

    //console.clear();
    //let time = performance.now();
    this.plyr.once('ready', () => {
      if (settings.performanceCheck){console.log(`This: ${performance.now() - time}ms`);}
      this.plyr.currentTime = currTime[1];
      this.plyr.once('seeked', () => {
        setTimeout(() => {
          switch (true){
            case (settings.mainAutoPlay):
              this.plyr.play();
              break;
            case (currStatus[1] && settings.keepPlayState):
              this.plyr.play();
              break;
            case (currStatus[1] && settings.mainVidKeep):
              this.plyr.play();
              break;
            default:
              this.plyr.pause();
              break;
          }
          this.plyr.volume = currVolume[1];
        });
      });
    });

    plyrObj.plyr.once('ready', () => {
      if (settings.performanceCheck){console.log(`This: ${performance.now() - time}ms`);}
      plyrObj.plyr.forward(currTime[0]);
      plyrObj.plyr.once('seeked', () => {
        setTimeout(() => {
          switch (true){
            case (currStatus[0] && settings.keepPlayState):
              plyrObj.plyr.play();
              break;
            default:
              plyrObj.plyr.pause();
              break;
          }
          plyrObj.plyr.volume = currVolume[0];
        });
      });
    });
  }

}

class generalIframe {
  constructor(divElement, vidSrc){
    this.parent = divElement.parentElement; // should be "SidePlayer"
    this.plyrElm = divElement; // probably is some form of "SidePlayer#"
    this._src = vidSrc; // should be a link
    this.iFrame = iframeCheck(divElement); // iframe element
    this.iFrame.src = vidSrc;
    this.inputElement = "Nuthin"; // should/will be an input element
  }
  inputSetup(){
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = 'Input a Link';
    this.inputElement.classList.add('videoLinkInput');
    this.parent.appendChild(this.inputElement);
    this.inputElement.addEventListener("change", () => {
      switch (true){
        case (this.inputElement.value.includes("delete")):
          this.delete();
          break;
        case (this.inputElement.value.includes("foxsports")):
          this.iFrame.src = foxLinkConvert(this.inputElement.value);
          break;
        default:
          this.iFrame.src = this.inputElement.value;
      }
    });
  }
  inputLinker (inputElement){
    this.inputElement = inputElement;
    this.inputElement.addEventListener("change", () => {
      if (inputElement.value.includes("delete")){plyrObj.inputElement.parentElement.remove()}
      this.iFrame.src = inputElement.value;
    });
  }
  generalSetup(){
    this.iFrame.classList.add('generalIframe');
    this.plyrElm.classList.add('generalIframePlyr');
    this.iFrame.sandbox = "allow-scripts allow-same-origin";
    this.inputSetup();
  }
  delete(){
    this.parent.remove();
  }
  set src(link){
    this._src = link;
    this.iFrame.src = link;
  }
  get src(){
    return this._src;
  }
}

document.addEventListener('DOMContentLoaded', () => {
//      Every player should always be wrapped in a DOMContentLoaded 
//     listener, if not then it might run before page is even loaded which
//    means causes code to try to find an element that doesn't yet exist.
  //window.scrollTo(0, quickID('top').clientHeight);
  window.scrollTo(0, 0);
  let plyr1 = new ytPlayer(quickID('MainMediaBox'), "https://youtu.be/tPWioxKVNe4?si=jzFw0GBHQMJ6wp-A", defaultSettings);
  let plyr2 = new ytPlayer(quickID('SidePlayer1'), "https://www.youtube.com/watch?v=-oyqNzNxLhk", defaultSettings);
  let plyr3 = new ytPlayer(quickID('SidePlayer2'), "https://www.youtube.com/watch?v=K74l26pE4YA", defaultSettings);
  let plyr4 = new ytPlayer(quickID('SidePlayer3'), "https://www.youtube.com/watch?v=ydYDqZQpim8", defaultSettings);
  //let iframePlayer = new generalIframe(quickID('iframePlyr'), 'https://statics.foxsports.com/static/orion/player-embed.html?id=fmc-3y2503hiymfj7j6s');
  //divOutliner();
  let allInputs = document.querySelectorAll(".videoLinkInput");
  allInputs.forEach((input) => {input.value = "";});

  plyr1.generalSetup();
  plyr2.generalSetup();
  plyr3.generalSetup();
  plyr4.generalSetup();
  //iframePlayer.generalSetup();

  quickID('sideOpenBtn').addEventListener('click', showSideBar);
  quickID('sideCloseBtn').addEventListener('click', hideSideBar);

  dragListener();

  //playerSwapMode(plyr1, [plyr2, plyr3, plyr4]);
  const topBarTester = () => {
    quickID('top').addEventListener('click', (e) => {
      //plyr3.swapLocation(plyr1.parent);
      //plyr3.swapPlyrs(plyr1);
      plyr1.swapLinks(plyr3, {mainAutoPlay: true});
    });
  }
  //topBarTester();
});


if (window.innerWidth < window.innerHeight){
  console.log('Phone');
  stylesheet.href = './mobileCustom/YouTubeMobileStyle.css';
  computer = false;
  quickID('mobileScript').src = './mobileCustom/mobileFunctions.js';
} else {
  console.log('Computer');
  stylesheet.href = 'YouTubeStyle.css';
}