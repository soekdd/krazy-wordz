/*global document localStorage console fetch window setTimeout*/
let gameId = null;
let playerId = null;
let ls = {};
let currentPlayerNum = 0;
if (localStorage.getItem("krazy")) {
  ls = JSON.parse(localStorage.getItem("krazy"));
}

// eslint-disable-next-line no-unused-vars
const showPlayer = (playerNum) => {
  currentPlayerNum = playerNum;
  getOtherPlayers(); 
}

const finishedGame = () => {
  fetch(`/app/finishCompare/${gameId}/${playerId}`,{
    method: "POST",
  }).then(() => {
    window.location.href = `show.html?${gameId}&${playerId}`;
  }).catch((error) => {
    console.error("Fetch error:", error);
  });
};

const getOtherPlayers = () => {
  fetch(`/app/getPlayers/${gameId}/${playerId}`)
    .then((response) => {
      if (!response.ok) {
        window.location.href = "index.html";
      }
      return response.json();
    })
    .then((data) => {
      startCompare(data);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};

// eslint-disable-next-line no-unused-vars
const submitCompare = (question,otherPlayerId) => {
  fetch(`/app/submitCompare/${gameId}/${playerId}/${otherPlayerId}`,{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  }).then(() => {
    getOtherPlayers();
  }).catch((error) => {
    console.error("Fetch error:", error);
  });
}

const checkData = () => {
  const urlParams = window.location.search?.substring(1)?.split("&") ?? [];
  if (urlParams.length === 2) {
    gameId = urlParams[0];
    playerId = urlParams[1];
  } else {
    if (ls?.gameId !== undefined) {
      gameId = ls.gameId;
    }
    if (gameId === null || playerId === null) {
      window.location.href = "index.html";
    }
  }
  getOtherPlayers();
};

const enableReadyBtn = () => {
  const btn1 = document.getElementById("readyBtn1");
  btn1.style.display="block";
  const btn2 = document.getElementById("readyBtn2");
  btn1.innerHTML = "Fertig?";
  btn2.innerHTML = "JA!";
  btn2.addEventListener("click", finishedGame );
  btn1.addEventListener("click", () => {
    if (
      btn1.innerHTML !== "NEIN!"
    ) {
      btn1.innerHTML = "NEIN!";
      btn2.style.display="block";
    } else {
      document.getElementById("readyBtn1").innerHTML = "Fertig?";
      btn2.style.display="none";
    }
  });

}
const startCompare = (players) => {
  fetch(`/app/compare/${gameId}/${playerId}/${currentPlayerNum}`)
  .then((response) => {
    if (!response.ok) {
      window.location.href = "index.html";
    }
    return response.json();
  })
  .then((data) => {
    if (data.finished) {
      enableReadyBtn();
    } else {
      document.getElementById("readyBtn1").style.display = "none";
      document.getElementById("readyBtn2").style.display = "none";
    }
    const answer =
    data.currentAnswer === "" ?"<h2>noch keine Antwort</h2>":data.currentAnswer;
    let s = "";
    if (currentPlayerNum > 0) {
        s += '<div class="buttonLine"><div class="bigButton" id="previousPlayer" onclick="showPlayer('+(currentPlayerNum-1)+')">&lt;&lt;</div>';
    } else {
        s += '<div class="buttonLine"><div class="emptyButton" id="previousPlayer">&nbsp;</div>';
        
    }
    s += '<div class="letters">'+answer+'</div>';
    if (currentPlayerNum < Object.keys(players).length-1) {
        s += '<div class="bigButton" id="nextPlayer" onclick="showPlayer('+(currentPlayerNum+1)+')">&gt;&gt;</div></div>';
    } else 
    { s += '<div class="emptyButton" id="previousPlayer">&nbsp;</div></div>';}
    document.getElementById('answer').innerHTML = s;

    document.getElementById("playerName").innerHTML = data.name;
    const questions = data.questions;
    s = '';
    for (const question in questions) {
      const usage = questions[question];
      const c = usage===false ? "unused" : (usage === data.id? "hit" : "used");
      s+= `<div class="otherQuestions ${c}Question" onclick="submitCompare('${question}','${data.id}')">${question}</div>`;
    }
    document.getElementById("questions").innerHTML = s;
  })
  .catch((error) => {
    console.error("Fetch error:", error);
  });

};
checkData();
