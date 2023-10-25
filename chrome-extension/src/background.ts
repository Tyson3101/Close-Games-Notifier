// Events
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["applicationIsOn"], (result) => {
    if (result.applicationIsOn == null) {
      chrome.storage.sync.set({
        applicationIsOn: true,
        desktopNotifications: true,
        discordWebhooks: [],
        popupNotifications: true,
        mutedGames: {},
      });
    }
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.applicationIsOn) {
    if (changes.applicationIsOn.newValue) {
      StartExtension();
    } else {
      clearInterval(intervalTimeout);
    }
  }
});

chrome.storage.sync.get(["applicationIsOn"], (result) => {
  if (result.applicationIsOn) {
    StartExtension();
  }
});

// Code

const NBA_API_URL =
  "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";

let intervalTimeout = 0;

const CloseGames: {
  [key: string]: {
    id: string;
    lastInterval: Interval;
    muted: boolean;
  };
} = {};

function StartExtension() {
  if (intervalTimeout) clearInterval(intervalTimeout);
  intervalTimeout = setInterval(async () => {
    if (await checkIfApplicationIsOn()) CheckCloseGames();
  }, 25 * 1000);
}

async function CheckCloseGames() {
  const response = await fetch(NBA_API_URL);
  const data = await response.json();
  const games = data.scoreboard.games;
  const closeGames = games
    .filter((game: Game) => {
      return (
        GetScoreDiff(game) <= 10 &&
        game.period >= 4 &&
        game.gameStatusText.trim() !== "Final"
      );
    })
    .map((game: Game) => {
      game.gamePeriod = game.gameStatusText.split(" ")[0];
      game.gameClock = game.gameStatusText.split(" ")[1];
      return game;
    });

  for (let game of closeGames) {
    game.currentInterval = {
      time: game.gameClock,
      scoreDiff: GetScoreDiff(game),
      overtime: game.period - 4,
    };
    if (!(await CheckIfValidGames(game))) continue;
    const notificationCheck = await CheckToNotify(
      CloseGames[game.gameId].lastInterval,
      game
    );
    if (notificationCheck) {
      game.nextUpdate = notificationCheck;
      Notify(game);
      CloseGames[game.gameId].lastInterval = game.currentInterval;
    }
  }
}

function Notify(game: Game) {
  chrome.storage.sync.get(
    ["desktopNotifications", "discordWebhooks", "popupNotifications"],
    (result) => {
      console.log("Notifying Storage", result);

      if (result.desktopNotifications) {
        NotifyDesktopNotification(game);
      }
      if (result.popupNotifications) {
        NotifyPopupNotification(game);
      }
      if (result.discordWebhooks.length > 0) {
        NotifyDiscordWebhooks(game, result.discordWebhooks);
      }
    }
  );
}

function NotifyDesktopNotification(game: Game) {
  const homeTeam = game.homeTeam;
  const awayTeam = game.awayTeam;
  const message = `CLOSE GAME ALERT!
  ${homeTeam.score} | ${homeTeam.teamCity} ${homeTeam.teamName} 
  ${awayTeam.score} | ${awayTeam.teamCity} ${awayTeam.teamName} 
  ${game.gameClock} ${game.gamePeriod}`;

  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "../img/icon.png",
      title: "NBA Close Game Notifier",
      message: message,
    },
    (notiId) => {
      setTimeout(() => {
        chrome.notifications.clear(notiId);
      }, 10000);
    }
  );
}

function NotifyPopupNotification(game: Game) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    console.log("Notifying ActiveTab", tabs[0]);
    await chrome.tabs
      .sendMessage(tabs[0]?.id, {
        type: "popupNotification",
        game: game,
      })
      .catch(() => {});
  });
}

function NotifyDiscordWebhooks(game: Game, webhookURLs: string[]) {
  for (let webhookURL of webhookURLs) {
    const homeTeam = game.homeTeam;
    const awayTeam = game.awayTeam;
    fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "CLOSE GAME ALERT!",

        embeds: [
          {
            title: `${homeTeam.score} | ${homeTeam.teamCity} ${homeTeam.teamName}\n${awayTeam.score} | ${awayTeam.teamCity} ${awayTeam.teamName}\n${game.gameClock} ${game.gamePeriod}`,
            color: "FF00FF",
            footer: {
              text: "Close Game Notifier",
            },
          },
        ],
      }),
    });
  }
}

// Checks

async function CheckToNotify(lastInterval: Interval, game: Game) {
  const currentInterval = {
    time: game.gameClock,
    scoreDiff: GetScoreDiff(game),
    overtime: game.period - 4,
  };
  const t1 = lastInterval?.time.split(":").map(Number);
  const t2 = currentInterval.time.split(":").map(Number);

  if (await checkGameMuted(game)) return false;

  if (t1[0] === t2[0]) return false;
  if (lastInterval?.overtime !== currentInterval.overtime) return "next OT";

  if (Number(t1[0]) > 9 && Number(t2[0]) <= 9) {
    if (currentInterval.scoreDiff <= 10) return "5:30";
  }
  if (Number(t1[0]) > 5 && Number(t2[0]) <= 5) {
    if (currentInterval.scoreDiff <= 10) return "1:30";
    return true;
  }
  if (Number(t1[0]) > 1 && Number(t2[0]) <= 1) {
    if (currentInterval.scoreDiff <= 5) return "OT";
  }
}

async function CheckIfValidGames(game: Game) {
  if (game.gameStatusText.trim() === "Final") {
    if (CloseGames[game.gameId]) {
      delete CloseGames[game.gameId];
    }
    return false;
  }
  if (!CloseGames[game.gameId]) {
    return (CloseGames[game.gameId] = {
      id: game.gameId,
      lastInterval: game.currentInterval,
      muted: await checkGameMuted(game),
    });
  }
  return true;
}

function checkGameMuted(game: Game): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["mutedGames"], (result) => {
      if (result.mutedGames[game.gameId]) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function checkIfApplicationIsOn(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      resolve(result.applicationIsOn);
    });
  });
}

// Util Functions

function GetScoreDiff(game: Game) {
  const homeTeam = game.homeTeam.score;
  const awayTeam = game.awayTeam.score;
  const difference = Math.abs(homeTeam - awayTeam);
  return difference;
}
