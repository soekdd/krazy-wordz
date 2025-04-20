/*global document localStorage console fetch window setTimeout*/
let gameId = null;
let playerId = null;
let playerName = "";
let ls = {};
if (localStorage.getItem("krazy")) {
  ls = JSON.parse(localStorage.getItem("krazy"));
}

const finishedGame = () => {
  fetch(`/app/finishGame/${gameId}/${playerId}`,{
    method: "POST"
  })
    .then((response) => {
      if (!response.ok) {
        window.location.reload();
      }
      window.location.href = `wait.html?${gameId}&${playerId}`;
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};

const getGame = () => {
  fetch(`/app/getGame/${gameId}/${playerId}`)
    .then((response) => {
      if (!response.ok) {
        window.location.href = "index.html";
      }
      return response.json();
    })
    .then((data) => {
      startGame(data);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
};

const submitAnswer = () => {
  const answer = document.getElementById("dropArea").innerHTML.replaceAll('display: none','display: flex');
  console.log('answer',answer);
  fetch(`/app/submitAnswer/${gameId}/${playerId}`,{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer }),
  })
}

const prepairInputPlayerName = () => {
  document.getElementById("title").innerHTML = "Bitte Spielernamen eingeben:";
  let s = "";
  s += '<input type="text" id="playerNameInput">';
  document.getElementById("letterPool").innerHTML = s;
  s = '<div class="bigButton" onclick="setName()">Fertig!</div>';
  document.getElementById("dropArea").innerHTML = s;
};

const setName = (playerName = null) => {
  playerName = playerName ?? document.getElementById("playerNameInput").value;
  const krazy = {
    gameId,
    playerId,
    playerName,
  };
  localStorage.setItem("krazy", JSON.stringify(krazy));
  fetch(
    `/app/setName/${gameId}/${playerId}/${encodeURIComponent(playerName)}`
  ).then(() => {
    document.getElementById("letterPool").innerHTML = "";
    document.getElementById("dropArea").innerHTML = "";
    getGame();
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
    const krazy = {
      gameId,
      playerName,
      playerId,
    };
    localStorage.setItem("krazy", JSON.stringify(krazy));
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
  if (playerName === "" || playerName.split(" ")[0] === "Spieler") {
    prepairInputPlayerName();
  } else {
    setName(playerName);
  }
};
const startGame = (game) => {
  const letters = game.letters;
  document.getElementById("title").innerHTML = game.currentQuestion;
  const letterPool = document.getElementById("letterPool");
  const icon = '<img src="right.svg">';
  const dropArea = document.getElementById("dropArea");
  const rotateArea = document.getElementById("rotateArea");

  const createLetter = (char, id, className) => {
    let touchedElement = null;
    const div = document.createElement("div");
    div.className = "letter " + className;
    div.innerHTML =
      '<div class="inner disorder_' +
      Math.floor(Math.random() * 6) +
      '">' +
      char +
      "</div>";
    div.draggable = true;
    div.id = id;

    div.addEventListener("dragstart", (e) => {
      if (e.currentTarget.parentElement?.classList.contains("slot")) {
        const oldRotater = document.getElementById(
          `rotater-${e.currentTarget.parentElement.dataset.index}`
        );
        oldRotater.innerHTML = "";
      }
      e.dataTransfer.setData("text/plain", div.id);
      setTimeout(() => (div.style.display = "none"), 0); // hide while dragging
    });

    div.addEventListener("touchstart", (e) => {
      touchedElement = div;
      div.style.opacity = "0.5";
      if (touchedElement.parentElement.dataset?.index !== undefined) {
        const oldRotater = document.getElementById(
          `rotater-${touchedElement.parentElement.dataset?.index}`
        );
        oldRotater.innerHTML = "";
      }
    });

    div.addEventListener("dragend", (e) => {
      div.style.display = "flex";
      if (e.target.parentElement.classList.contains("slot")) {
        const newRotater = document.getElementById(
          `rotater-${e.target.parentElement.dataset.index}`
        );
        if (newRotater) {
          newRotater.innerHTML = icon;
        }
      }
    });

    div.addEventListener("touchend", (e) => {
      div.style.opacity = "1";
      const touch = e.changedTouches[0];
      let dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      while (
        dropTarget &&
        !dropTarget.classList.contains("slot") &&
        !dropTarget.classList.contains("letters")
      ) {
        dropTarget = dropTarget.parentElement;
      }
      if (dropTarget) {
        dropTarget.appendChild(div);
        if (dropTarget.classList.contains("slot")) {
          const newRotater = document.getElementById(
            `rotater-${dropTarget.dataset.index}`
          );
          if (newRotater) {
            newRotater.innerHTML = icon;
          }
        }
      } else {
        const newRotater = document.getElementById(
          `rotater-${touchedElement.parentElement.dataset?.index}`
        );
        if (newRotater) {
          newRotater.innerHTML = icon;
        }
      }
      touchedElement = null;
      submitAnswer();
    });

    div.addEventListener("dblclick", () => {
      // Only allow if the letter is currently in a slot
      if (div.parentElement.classList.contains("slot")) {
        const oldRotater = document.getElementById(
          `rotater-${div.parentElement.dataset.index}`
        );
        oldRotater.innerHTML = "";
        div.parentElement.textContent = ""; // clear slot
        letterPool.appendChild(div); // move back to pool
      }
    });

    return div;
  };

  // Create letter pool
  letters.forEach((l, index) => {
    const letter = createLetter(
      l.char,
      `pool-${index}`,
      l.v ? "vowels" : "consonants"
    );
    letterPool.appendChild(letter);
  });

  // Create 10 drop slots
  for (let i = 0; i < letters.length+2; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.id = `slot-${i}`;
    slot.dataset.index = i;

    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("highlight");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("highlight");
    });

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      const newRotater = document.getElementById(
        `rotater-${e.toElement.dataset.index}`
      );
      if (newRotater) {
        newRotater.innerHTML = icon;
      }
      slot.classList.remove("highlight");

      const letterId = e.dataTransfer.getData("text/plain");
      const letter = document.getElementById(letterId);

      // If there's already a letter in the slot, send it back to pool
      if (slot.firstChild) {
        letterPool.appendChild(slot.firstChild);
      }

      slot.textContent = "";
      slot.appendChild(letter);
      submitAnswer();
    });

    dropArea.appendChild(slot);

    const rotater = document.createElement("div");
    rotater.className = "rotater";
    rotater.id = `rotater-${i}`;
    rotater.innerHTML;
    rotater.addEventListener("click", () => {
      const letter = slot.firstChild;
      if (letter) {
        let rot = 0;
        for (let r = 0; r < 4; r++) {
          if (letter.classList.contains("rotated_" + r)) {
            rot = r;
            letter.classList.remove("rotated_" + r);
          }
        }
        letter.classList.add("rotated_" + ((rot + 1) % 4));
      }
      submitAnswer();
    });
    rotateArea.appendChild(rotater);
  }

  // Allow dragging back to pool
  letterPool.addEventListener("dragover", (e) => {
    e.preventDefault();
    letterPool.classList.add("highlight");
  });

  letterPool.addEventListener("dragleave", () => {
    letterPool.classList.remove("highlight");
  });

  letterPool.addEventListener("drop", (e) => {
    e.preventDefault();
    letterPool.classList.remove("highlight");

    const letterId = e.dataTransfer.getData("text/plain");
    const letter = document.getElementById(letterId);

    // Remove from previous slot
    if (letter.parentElement.classList.contains("slot")) {
      const oldRotater = document.getElementById(
        `rotater-${letter.parentElement.dataset.index}`
      );
      letter.parentElement.textContent = "";
      oldRotater.innerHTML = "";
    }

    letterPool.appendChild(letter);
    submitAnswer();
  });
  const btn1 = document.getElementById("readyBtn1");
  const btn2 = document.getElementById("readyBtn2");
  btn1.innerHTML = "Fertig?";
  btn1.addEventListener("click", () => {
    if (
      btn1.innerHTML !== "NEIN!"
    ) {
      btn1.innerHTML = "NEIN!";
      btn2.classList.toggle("activeBtn");
      btn2.innerHTML = "JA!";
      btn2.addEventListener("click", finishedGame );
    } else {
      btn2.classList.toggle("activeBtn");
      btn2.removeEventListener("click", finishedGame);
      document.getElementById("readyBtn1").innerHTML = "Fertig?";
      btn2.innerHTML = "";
    }
  });
};

checkData();
