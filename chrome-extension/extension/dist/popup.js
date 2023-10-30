// Toggle Button
const toggleBtn = document.querySelector(".toggleBtn");
chrome.storage.local.get(["applicationIsOn"], (result) => {
    changeToggleButton(result["applicationIsOn"] !== null ? result["applicationIsOn"] : true);
});
toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (!result.applicationIsOn) {
            chrome.storage.local.set({ applicationIsOn: true });
            changeToggleButton(true);
        }
        else {
            chrome.storage.local.set({ applicationIsOn: false });
            changeToggleButton(false);
        }
    });
});
function changeToggleButton(result) {
    toggleBtn.innerText = result ? "Stop" : "Start";
    toggleBtn.classList.remove(result ? "start" : "stop");
    toggleBtn.classList.add(result ? "stop" : "start");
}
// Show Schedule
const gamesContainer = document.querySelector(".games");
const hideScoresCheckbox = document.querySelector("#hideScores");
getGames();
async function getGames() {
    const data = await fetch("https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json");
    const games = (await data.json()).scoreboard.games;
    console.log("games", games);
    if (games.length === 0) {
        return (gamesContainer.innerHTML = "<h1>No Games Today</h1>");
    }
    games.forEach((game) => {
        game.formattedTime = game.gameStatusText;
        if (game.gameStatusText.includes("pm") ||
            game.gameStatusText.includes("am")) {
            const gameTimeUTC = game.gameTimeUTC;
            const utcDate = new Date(gameTimeUTC);
            const localHours = utcDate.getHours();
            const localMinutes = utcDate.getMinutes();
            const ampm = localHours >= 12 ? "PM" : "AM";
            const formattedHours = (localHours % 12 || 12)
                .toString()
                .padStart(2, "0");
            const formattedMinutes = localMinutes.toString().padStart(2, "0");
            const formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
            game.formattedTime = formattedTime;
        }
        createScoreboardGame(game);
    });
}
async function createScoreboardGame(game) {
    const gameId = game.gameId;
    const homeTeamName = game.homeTeam.teamTricode;
    const awayTeamName = game.awayTeam.teamTricode;
    const homeTeamScore = game.homeTeam.score;
    const awayTeamScore = game.awayTeam.score;
    const time = game.formattedTime;
    const muted = await getGameMutedStatus(gameId);
    const hideScores = hideScoresCheckbox.checked;
    const htmlString = `
  <div class="scoreboard" id="${gameId}">
    <div class="teams">
      <div>
        <span data-homeTeamName>${homeTeamName}</span>
      </div>
      <div class="score">
        <span data-homeScore ${!hideScores ? "" : `class="hidden"`}>${homeTeamScore}</span><span data-hiddenScore ${hideScores ? "" : `class="hidden"`}>--</span> |
        <span data-awayScore ${!hideScores ? "" : `class="hidden"`}>${awayTeamScore}</span><span data-hiddenScore ${hideScores ? "" : `class="hidden"`}>--</span>
      </div>
      <div>
        <span data-awayTeamName>${awayTeamName}</span>
      </div>
    </div>
    <div class="bottom">
      <div>
        <span data-time>${time}</span>
      </div>
      <div>
        <button data-muteStatus>${!muted ? "Mute" : "Unmute"} Game</button>
    </div>
  </div>
`;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    const scoreboard = tempDiv.querySelector(".scoreboard");
    gamesContainer.appendChild(scoreboard);
    scoreboard
        .querySelector("[data-muteStatus]")
        ?.addEventListener("click", changeMuteStatus);
    function changeMuteStatus() {
        const muted = scoreboard.querySelector("[data-muteStatus]");
        muted.innerText =
            muted.innerText === "Mute Game" ? "Unmute Game" : "Mute Game";
        chrome.storage.sync.get("mutedGames", (result) => {
            const mutedGames = result.mutedGames;
            if (mutedGames[gameId]) {
                delete mutedGames[gameId];
            }
            else {
                mutedGames[gameId] = true;
            }
            chrome.storage.sync.set({ mutedGames });
        });
    }
}
function getGameMutedStatus(gameId) {
    return new Promise((resolve) => {
        chrome.storage.sync.get("mutedGames", (result) => {
            console.log("result", result);
            resolve(result.mutedGames[gameId] !== undefined);
        });
    });
}
chrome.storage.sync.get(["hideScores"], (result) => {
    if (result.hideScores == undefined) {
        chrome.storage.sync.set({ hideScores: false });
        return (hideScoresCheckbox.checked = false);
    }
    hideScoresCheckbox.checked = result.hideScores;
});
hideScoresCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ hideScores: hideScoresCheckbox.checked });
    if (hideScoresCheckbox.checked) {
        document.querySelectorAll("[data-homeScore]").forEach((element) => {
            element.classList.add("hidden");
        });
        document.querySelectorAll("[data-awayScore]").forEach((element) => {
            element.classList.add("hidden");
        });
        document.querySelectorAll("[data-hiddenScore]").forEach((element) => {
            element.classList.remove("hidden");
        });
    }
    else {
        document.querySelectorAll("[data-homeScore]").forEach((element) => {
            element.classList.remove("hidden");
        });
        document.querySelectorAll("[data-awayScore]").forEach((element) => {
            element.classList.remove("hidden");
        });
        document.querySelectorAll("[data-hiddenScore]").forEach((element) => {
            element.classList.add("hidden");
        });
    }
});
