const NotificationsContainer = document.createElement("div");
const notiGameIds = new Set();

(function appendNotificationsContainer() {
  NotificationsContainer.style.position = "fixed";
  NotificationsContainer.style.top = "2%";
  NotificationsContainer.style.right = "2%";
  NotificationsContainer.style.zIndex = "1000";
  document.body.appendChild(NotificationsContainer);
})();

const unmutedBellImage = new Image(30, 30);
unmutedBellImage.src = "https://svgshare.com/i/ymL.svg";

const mutedBellImage = new Image(30, 30);
mutedBellImage.src = "https://svgshare.com/i/yms.svg";

chrome.runtime.onMessage.addListener(
  async ({ type, game }: { type: string; game: Game }, _, sendResponse) => {
    if (type !== "popupNotification") return false;
    console.log("Messaage reviceived from background.ts");

    const homeTeam = game.homeTeam;
    const awayTeam = game.awayTeam;

    const message = `
     ${homeTeam.teamCity} ${homeTeam.teamName} <b>${homeTeam.score}</b> | <b>${awayTeam.score}</b> ${awayTeam.teamCity} ${awayTeam.teamName}<br/>
     ${game.gameClock} ${game.gamePeriod}`;

    // Create and style the popup using HTML and CSS
    const popupHTML = `<div
      id="${game.gameId}"
      style="
        position: relative;
        font-family: Arial, Helvetica, sans-serif;
        min-width: 300px;
        color: black;
        background-color: #fff;
        border: 1px solid #ccc;
        padding: 15px 10px;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        margin-bottom: 3px;
        z-index: 1001;
        font-size: 10px;
      "
    >
    <div style="display: flex;">
        <h2 style="margin:0 0;">CLOSE GAME ALERT!</h2>
    </div>
      <p style="font-size: 1.1em;">
        ${message}
      </p>
      <button
        id="closePopupBtn"
        style="
          background-color: #f44336;
          color: white;
          border: none;
          padding: 7px 17px;
          cursor: pointer;
        "
      >
        Close
      <button
        id="ChangeMutedStatusBtn"
        style="
          display: inline-block;
          margin-left: 10px;
          background-color: #808080;
          color: white;
          border: none;
          padding: 7px 17px;
          cursor: pointer;
        "
      >
        Mute Game
      </button>
      </button>
      <div id="notiCloseGameBell" style="position: absolute; top: 7%; right: 35px; margin: 0; cursor: pointer; title="Mute Notifications from this Game"
        ><img
          src="${unmutedBellImage.src}"
          alt="NotiBell"
          width="22"
          height="22"
      /></div>
      <div id="closePopupX" style="position: absolute; top: 7%; right: 2%; cursor: pointer;" margin: 0;>
          <img
            src="https://svgshare.com/i/yk5.svg"
            alt=""
            width="22"
            height="22"
          />
      </div>
      <i style="display: inline-block; margin-left: 10px;">Next update at ${game.nextUpdate}</i>
    </div>`;

    let popupContainer = document.getElementById(game.gameId)?.parentElement;
    if (notiGameIds.has(game.gameId)) {
      popupContainer.innerHTML = popupHTML;
    } else {
      // Append the popup to the document body
      notiGameIds.add(game.gameId);
      popupContainer = document.createElement("div");
      popupContainer.innerHTML = popupHTML;
      NotificationsContainer.appendChild(popupContainer);
    }
    popupContainer
      .querySelector("#closePopupBtn")
      .addEventListener("click", () => {
        notiGameIds.delete(game.gameId);
        NotificationsContainer.removeChild(popupContainer);
      });

    popupContainer
      .querySelector("#closePopupX")
      .addEventListener("click", () => {
        notiGameIds.delete(game.gameId);
        NotificationsContainer.removeChild(popupContainer);
      });

    popupContainer
      .querySelector("#notiCloseGameBell")
      .addEventListener("click", async () => {
        UIChangeMuteStatus();
        StorageChangeMutedStatus(game.gameId);
      });
    popupContainer
      .querySelector("#ChangeMutedStatusBtn")
      .addEventListener("click", async () => {
        UIChangeMuteStatus();
        StorageChangeMutedStatus(game.gameId);
      });

    async function UIChangeMuteStatus() {
      let bellElement = popupContainer.querySelector(
        "#notiCloseGameBell img"
      ) as HTMLImageElement;
      let buttonElement = popupContainer.querySelector(
        "#ChangeMutedStatusBtn"
      ) as HTMLImageElement;

      let newMutedStatus = !(await getMutedStatus(game.gameId));

      bellElement.src = newMutedStatus
        ? unmutedBellImage.src
        : mutedBellImage.src;
      bellElement.title = `${
        newMutedStatus ? "Mute" : "Unmute"
      } Notifications from this Game`;

      buttonElement.innerText = `${newMutedStatus ? "Mute" : "Unmute"} Game`;
    }
    return true;
  }
);

function getMutedStatus(gameId: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["mutedGames"], (result) => {
      const mutedGames = result.mutedGames;
      if (mutedGames && mutedGames[gameId]) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function StorageChangeMutedStatus(gameId: string) {
  chrome.storage.sync.get(["mutedGames"], (result) => {
    const mutedGames = result.mutedGames;
    if (mutedGames && mutedGames[gameId]) {
      delete mutedGames[gameId];
    } else {
      mutedGames[gameId] = true;
    }
    chrome.storage.sync.set({ mutedGames });
  });
}
