/*global document localStorage console fetch window setTimeout*/
let gameId = null;
let playerId = null;
let playerName = "";
let ls = {};
if (localStorage.getItem("krazy")) {
  ls = JSON.parse(localStorage.getItem("krazy"));
}

const nextRound = () => {
  fetch(`/app/nextRound/${gameId}/${playerId}`,{
    method: "POST",
  }).then(() => {
    window.location.href = `next.html?${gameId}&${playerId}`;
  }).catch((error) => {
    console.error("Fetch error:", error);
  });
};


const getState = () => {
  fetch(`/app/getShow/${gameId}`)
    .then((response) => {
      if (!response.ok) {
        window.location.href = "index.html";
      }
      return response.json();
    })
    .then((data) => {
      if (data.ready && data.show) {
        const show = data.show;
        let s = '';
        if (show.finished) {
          document.getElementById("title").innerHTML = "Runde vorbei!";
          document.getElementById("show").innerHTML = "Neue Punkte:";
          for(const id of Object.keys(show.cards)) {
            const card = show.cards[id];
            const points = show.points[id];
            s += '<div class="showCard activeBtn">'+ card.name + " <br>&nbsp;<br><b>" + points + '</b>';
            s += '</div>';
          }
          document.getElementById("cards").innerHTML = s;
          document.getElementById("readyBtn1").style.display = "block";
          document.getElementById("readyBtn1").addEventListener("click", nextRound);
          return;
        }
        const points = show.points[show.player.id];
        document.getElementById("title").innerHTML = show.player.name + " (" + points + ")";
        document.getElementById("show").innerHTML = show.player.currentAnswer;
        for(const id of Object.keys(show.cards)) {
          const card = show.cards[id];
          const points = show.points[id];
          if (card.name!==show.player.name){
          s += '<div class="showCard activeBtn'+(card.points>0?' winner':'')+'">'+ card.name + " (" + points + ')<br>';
          if (card.question) {
            if (card.points>0) {
                s += '<br><b>'+card.question+'</b>';
            } else {
              s += '<br>'+card.question;
            }
          } else {
            s += '<br>???';
          }
          s += '</div>';
        }
        }
        document.getElementById("cards").innerHTML = s;
        // document.getElementById("readyBtn1").addEventListener("click", continueGame);
      } else { 
        document.getElementById("show").innerHTML = data.numFinished +" / " +data.numPlayers;
      }
      setTimeout(getState, 500);
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
