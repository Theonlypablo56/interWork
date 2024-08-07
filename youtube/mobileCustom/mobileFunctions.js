/*
    touchstart
    touchend
    touchcancel
    touchmove
*/
console.log("mobileFunctions.js loaded");

document.addEventListener('touchmove', (e) => {
  //console.log(e);
  //console.log(e.touches[0].clientX, e.touches[0].clientY);
});

const quickID = (idName) => {
  return document.getElementById(idName); // I got tired ok.
}

quickID('MainMediaBox').parentElement.style.width = '80%';