
/*global document qrcode location localStorage console fetch window*/
const playerDiv = document.getElementById('playerNumber');
let globalGame = {};
let myId = '';
const showPlayer = (playerNum) => {
    const url = location.origin+'/game.html?'+globalGame.id+'&'+Object.keys(globalGame.players)[playerNum];
    const text = 'Krazy Wordz, spiele mit mir:\n\n';
    const whatsappURL = `<a href="https://wa.me/?text=${encodeURIComponent(text+url)}"><img src="whatsapp.svg" alt="WhatsApp" class="icon"/></a>`;

    // Signal share URL (uses signal:// link for mobile, may need fallback)
    const signalURL = `<a href="signal://send?text=${encodeURIComponent(text+url)}"><img src="signal.svg" alt="Signal" class="icon"/></a>`;

    let s = '<h1><a href="'+url+'">Spieler #'+(playerNum+1)+'</a>&nbsp;'+whatsappURL+signalURL+'</h1>';
    if (playerNum > 1) {
        s += '<div class="buttonLine"><div class="bigButton" id="previousPlayer" onclick="showPlayer('+(playerNum-1)+')">&lt;&lt;</div>';
    } else {
        s += '<div class="buttonLine"><div class="emptyButton" id="previousPlayer">&nbsp;</div>';
        
    }
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    s += '<div class="qr">'+qr.createImgTag(
        10,
        0
      )+'</div>';
    if (playerNum < Object.keys(globalGame.players).length-1) {
        s += '<div class="bigButton" id="nextPlayer" onclick="showPlayer('+(playerNum+1)+')">&gt;&gt;</div></div>';
    } else 
    {s += '<div class="bigButton" id="nextPlayer" onclick="_startGame()">Start!</div></div>';}
    document.getElementById('newGame').innerHTML = s;
    
}
const gotGame = (gameSet) =>{
    globalGame = gameSet;
    myId = Object.keys(gameSet.players)[0];
    const player = gameSet.players[myId];
    const krazy = {
        gameId: gameSet.id,
        playerId:player.id,
        playerName:player.name ?? ""
    }
    // localStorage.setItem('krazy', JSON.stringify(krazy));
    // getFullGame();
    showPlayer(1);
}
const _startGame = () => {
    window.location.href = `game.html?${globalGame.id}&${myId}`;
}
const newGame = async (number) => {
    fetch(`/app/newGame/${number}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        gotGame(data)
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
}

const getFullGame = () => {
    fetch(`/app/getGame/${globalGame.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
       console.log('full game',data); 
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
}

for(let i=2;i<8;i++) {
    const div = document.createElement('div');
    div.className = 'bigButton';
    div.innerHTML = i+1;
    div.onclick = () => {
        newGame(i+1);
    }
    playerDiv.appendChild(div);
}