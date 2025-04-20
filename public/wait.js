/*global document localStorage console fetch window setTimeout*/
let gameId = null;
let playerId = null;
let playerName = "";
let ls = {};
if (localStorage.getItem("krazy")) {
  ls = JSON.parse(localStorage.getItem("krazy"));
}

const continueGame = () => {
  window.location.href = `compare.html?${gameId}&${playerId}`;
};

const getState = () => {
  fetch(`/app/getState/${gameId}`)
    .then((response) => {
      if (!response.ok) {
        window.location.href = "index.html";
      }
      return response.json();
    })
    .then((data) => {
      if (data.ready) {
        continueGame();
        document.getElementById("title").innerHTML = "Alle fertig!";
        document.getElementById("readyBtn1").style.display = "block";
        document.getElementById("progress").innerHTML = "";
        document.getElementById("readyBtn1").addEventListener("click", continueGame);
      } else { 
        document.getElementById("progress").innerHTML = data.numFinished +" / " +data.numPlayers;
        setTimeout(getState, 500);
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};

const checkData = () => {
  const urlParams = window.location.search?.substring(1)?.split("&") ?? [];
  if (urlParams.length === 2) {
    gameId = urlParams[0];
    playerId = urlParams[1];
    if (
      (ls?.playerName !== undefined) &
      (playerName.split(" ")[0] !== "Spieler")
    ) {
      playerName = ls.playerName;
    }
  } else {
    if (ls?.playerName !== undefined) {
      playerName = ls.playerName;
    }
    if (ls?.playerId !== undefined) {
      playerId = ls.playerId;
    }
    if (ls?.gameId !== undefined) {
      gameId = ls.gameId;
    }
    if (gameId === null || playerId === null) {
      window.location.href = "index.html";
    }
  }
  getState();
};

checkData();
