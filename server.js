/*global console setTimeout*/
import express from "express";
import ini from "ini";
import fs from "fs";

import data from "./data.js"; // Read and parse config.ini
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
const port = config.server.port || 3000;
const games = {};
const app = express();
const numVovels = 3;
const numConsonants = 6;

function getNewId() {
  return Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(12, "0");
}

function getNewQuestion(game) {
  const arr = Array.from(game.questions);

  const question = arr[Math.floor(Math.random() * arr.length)];

  game.questions.delete(question);
  return question;
}

function startShow(game){
  if (game.show === undefined) {
    const show = {};
    show.playerNum = Object.keys(game.players).length;
    show.cPlayerNum = 0;
    show.oPlayerNum = 0;
    show.cards = Object.fromEntries(Object.keys(game.players).map((id) => [id, {name:game.players[id].name}]))
    show.points = Object.fromEntries(Object.keys(game.players).map((id) => [id,0]))
    game.show = show;
  }
  showStep(game);
}

function showStep(game){
  const show = game.show;
  show.player = Object.values(game.players)[game.show.cPlayerNum];
  if (game.show.oPlayerNum<show.playerNum) {
    const otherPlayer = Object.values(game.players)[game.show.oPlayerNum];
    show.cards[otherPlayer.id].question = Object.entries(otherPlayer.assignedQuestion).filter(entry => entry[1]===show.player.id).map(entry => entry[0])[0];
    const points = show.cards[otherPlayer.id].question === show.player.currentQuestion ? 1 : 0;
    show.cards[otherPlayer.id].points = points;
    show.points[otherPlayer.id] += points;
    show.points[show.player.id] += points;
  }
  setTimeout(() => nextStep(game), 2000);
}

function nextStep(game){
  const show = game.show;
  show.oPlayerNum = (show.oPlayerNum + 1) % (show.playerNum+1);
  if (show.oPlayerNum ===  show.playerNum) {
    show.cPlayerNum = (show.cPlayerNum + 1);
    show.cards = Object.fromEntries(Object.keys(game.players).map((id) => [id, {name:game.players[id].name}]))
  }
  console.log('show',show.cPlayerNum,show.oPlayerNum);
  if (show.cPlayerNum ===  show.playerNum) { 
    show.finished = true;
  } else {
    showStep(game);
  }
}

function getNewLetter(bag) {
  const index = Math.floor(Math.random() * bag.length);

  const letter = bag[index];
  bag.splice(index, 1);
  
  return letter;
}

function newRound(game) {
  const c = true;
  const v = true;
  const currentQuestions = [getNewQuestion(game), getNewQuestion(game)];
  const vowelsBag = data.getNewVowelsBag();
  const consonantsBag = data.getNewConsonantsBag();
  for (const player of Object.values(game.players)) {
    player.nextRound = false;
    const letters = [];
    for (let i = 0; i < numVovels; i++) {
      letters.push({ char: getNewLetter(vowelsBag), v });
    }
    for (let i = 0; i < numConsonants; i++) {
      letters.push({ char: getNewLetter(consonantsBag), c });
    }
    player.letters = letters;
    const currentQuestion = getNewQuestion(game);
    player.currentQuestion = currentQuestion;
    currentQuestions.push(currentQuestion);
    if (game.show?.points?.[player.id] !== undefined) {
      player.points += game.show.points[player.id];
    }
  }
  game.currentQuestions = currentQuestions;
  delete game.show;
}

app.use(express.static("public"));
app.use(express.static("node_modules"));
app.use(express.json());

app.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}`);
});

app.get("/app/newGame/:number", (req, res) => {
  const numPlayer = req.params.number;
  const id = getNewId();
  const game = {
    id,
    numPlayer,
    players: {},
  };
  for (let i = 0; i < numPlayer; i++) {
    const playerId = getNewId();
    game.players[playerId] = {
      name: `Spieler ${i + 1}`,
      id: playerId,
      points: 0,
    };
  }
  games[id] = game;
  game.numPlayer = numPlayer;
  res.send(game);
  game.questions = data.getAllQuestions();
  newRound(game);
});

app.get("/app/setName/:gameId/:playerId/:playerName", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const playerName = req.params.playerName;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  game.players[playerId].name = playerName;
  res.send(game.players[playerId]);
});

app.get("/app/getGame/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  res.send({ ...game, questions: Array.from(game.questions) });
});

app.get("/app/getPlayers/:gameId/:playerId", (req, res) => {
  const gameId = req.params.gameId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  res.send(Object.fromEntries(
      Object.entries(game.players)
        .filter(([ id ]) => id !== req.params.playerId)
        .map(([id, player]) => [id,{
            name:player.name, 
            currentAnswer:player.currentAnswer, 
            id}]
          )
        )
      );
});

app.get("/app/getGame/:gameId/:playerId", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  res.send(game.players[playerId]);
});

app.get("/app/getState/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const result = {
    numPlayers: Object.keys(game.players).length,
    numFinished: Object.values(game.players).filter(p => p.finished).length,
  }
  result.ready = result.numPlayers === result.numFinished;
  res.send(result);
})

app.get("/app/getNextRound/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const result = {
    numPlayers: Object.keys(game.players).length,
    numFinished: Object.values(game.players).filter(p => p.nextRound).length,
  }
  result.ready = game.show === undefined || result.numPlayers === result.numFinished;
  res.send(result);
})

app.get("/app/getShow/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const result = {
    numPlayers: Object.keys(game.players).length,
    numFinished: Object.values(game.players).filter(p => p.finishedCompare).length,
  }
  result.ready = result.numPlayers === result.numFinished;
  
  if (result.ready && game.show === undefined) {
    startShow(game);
  }
  result.show = game.show;
  res.send(result);
})

app.post("/app/finishGame/:gameId/:playerId", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const player = game.players[playerId];
  player.finished = true;
  res.send("OK");
});

app.post("/app/finishCompare/:gameId/:playerId", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const player = game.players[playerId];
  player.finishedCompare = true;
  res.send("OK");
});

app.post("/app/nextRound/:gameId/:playerId", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const player = game.players[playerId];
  player.nextRound = true;
  const allFinished = Object.keys(game.players).length === Object.values(game.players).filter(p => p.nextRound).length;
  if (allFinished) {
    newRound(game);
  }
  res.send("OK");
});

app.post("/app/submitAnswer/:gameId/:playerId", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const answer = req.body.answer;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const player = game.players[playerId];
  player.currentAnswer = answer;
  res.send("OK");
});

app.get("/app/compare/:gameId/:playerId/:playerNum", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const playerNum = req.params.playerNum;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const otherPlayerId = Object.keys(game.players).filter(
    (id) => id !== playerId
  )?.[playerNum];
  if (!otherPlayerId) {
    res.status(404).send("Player not found");
    return;
  }
  const otherPlayer = game.players[otherPlayerId];
  const player = game.players[playerId];
  if (!player.assignedQuestion) {
    const otherQuestions = 
    game.currentQuestions.filter(q => q !== game.players[playerId].currentQuestion);
    player.assignedQuestion = Object.fromEntries(
      otherQuestions.map((q) => [q, false])
    )
  }
  const finished = Object.values(player.assignedQuestion).filter(q => q).length === 
    Object.keys(game.players).length-1;
  res.send({
    currentAnswer: otherPlayer.currentAnswer ?? "", 
    name: otherPlayer.name, 
    id: otherPlayer.id,
    finished,
    questions:player.assignedQuestion
  });
});

app.post("/app/submitCompare/:gameId/:playerId/:otherPlayerId", (req, res) => {
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  const otherPlayerId = req.params.otherPlayerId;
  const question = req.body.question;
  const game = games[gameId];
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
  const player = game.players[playerId];
  if (!player.assignedQuestion) {
    const otherQuestions = 
    game.currentQuestions.filter(q => q !== game.players[playerId].currentQuestion);
    player.assignedQuestion = Object.fromEntries(
      otherQuestions.map((q) => [q, false])
    )
  }
  for (const q in player.assignedQuestion) {
    if (player.assignedQuestion[q] === otherPlayerId) {
      player.assignedQuestion[q] = false;
    }
  }
  player.finished = Object.values(player.assignedQuestion).filter(q => q).length === 
    Object.keys(game.players).length-1;
  player.assignedQuestion[question] = otherPlayerId;
  res.send("OK");
});