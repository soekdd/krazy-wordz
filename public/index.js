/*global document localStorage window*/
const checkLocalStorage = ()=>{
    if (localStorage.getItem('krazy')) {
        return JSON.parse(localStorage.getItem('krazy'))
    }
    return null;
}

const continueGame = () => {
    window.location.href = `game.html`
}

const newGame = () => {
    window.location.href = `new.html`
}

if (checkLocalStorage()===null) {
    document.getElementById('continueGameButton').style.display = 'none';
}
