chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        applicationIsOn: true,
        desktopNotifications: true,
        discordWebhooks: [],
        popupNotifications: true,
    });
});
const NBA_API_URL = "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";
const CloseGames = {};
setInterval(() => {
    chrome.tabs.query({});
    console.log("done");
    CheckCloseGames();
}, 29 * 1000);
async function CheckCloseGames() {
    const response = await fetch(NBA_API_URL);
    const data = await response.json();
    const games = data.scoreboard.games;
    console.log(games);
    const closeGames = games.filter((game) => {
        return (GetScoreDiff(game) <= 10 && game.period >= 4 && game.gameClock !== "");
    });
    for (let game of closeGames) {
        const currentInterval = {
            time: game.gameClock,
            scoreDiff: GetScoreDiff(game),
            overtime: game.period - 4,
        };
        if (!CheckIfValidGames(game, currentInterval))
            continue;
        if (CheckToNotify(CloseGames[game.gameId].lastInterval, currentInterval)) {
            Notify(game);
            CloseGames[game.gameId].lastInterval = currentInterval;
        }
    }
}
function Notify(game) {
    chrome.storage.sync.get(["desktopNotifications", "discordWebhooks", "popupNotifications"], (result) => {
        if (result.desktopNotifications) {
            NotifyDesktopNotification(game);
        }
        if (result.popupNotifications) {
            NotifyPopupNotification(game);
        }
        if (result.discordWebhooks.length > 0) {
            NotifyDiscordWebhooks(game, result.discordWebhooks);
        }
    });
}
function CheckToNotify(lastInterval, currentInterval) {
    const t1 = lastInterval?.time.split(":").map(Number);
    const t2 = currentInterval.time.split(":").map(Number);
    console.log({ lastInterval, currentInterval, t1, t2 });
    if (t1[0] === t2[0])
        return false;
    if (lastInterval?.overtime !== currentInterval.overtime)
        return true;
    if (Number(t1[0]) > 9 && Number(t2[0]) <= 9) {
        if (currentInterval.scoreDiff <= 10)
            return true;
    }
    if (Number(t1[0]) > 5 && Number(t2[0]) <= 5) {
        if (currentInterval.scoreDiff <= 7)
            return true;
        return true;
    }
    if (Number(t1[0]) > 1 && Number(t2[0]) <= 1) {
        if (currentInterval.scoreDiff <= 5)
            return true;
    }
}
function CheckIfValidGames(game, currentInterval) {
    if (game.gameStatusText.trim() === "Final") {
        if (CloseGames[game.gameId]) {
            delete CloseGames[game.gameId];
        }
        return false;
    }
    if (!CloseGames[game.gameId]) {
        return (CloseGames[game.gameId] = {
            id: game.gameId,
            lastInterval: { ...currentInterval, time: "15:00" },
        });
    }
    return true;
}
function GetScoreDiff(game) {
    const homeTeam = game.homeTeam.score;
    const awayTeam = game.awayTeam.score;
    const difference = Math.abs(homeTeam - awayTeam);
    return difference;
}
function NotifyDesktopNotification(game) {
    const homeTeam = game.homeTeam;
    const awayTeam = game.awayTeam;
    const message = `CLOSE GAME ALERT!
  ${homeTeam.score} | ${homeTeam.teamCity} ${homeTeam.teamName} 
  ${awayTeam.score} | ${awayTeam.teamCity} ${awayTeam.teamName} 
  ${game.gameClock} ${GamePeriod(game)}`;
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "NBA Close Game Notifier",
        message: message,
    });
}
function NotifyPopupNotification(game) {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        console.log(tabs[0]);
        await chrome.tabs.sendMessage(tabs[0]?.id, {
            type: "popupNotification",
            game: game,
        });
    });
}
function NotifyDiscordWebhooks(game, webhookURLs) {
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
                        title: `${homeTeam.score} | ${homeTeam.teamCity} ${homeTeam.teamName}\n${awayTeam.score} | ${awayTeam.teamCity} ${awayTeam.teamName}\n${game.gameClock} ${GamePeriod(game)}`,
                        color: "FF00FF",
                        footer: {
                            text: "NBA Close Game Notifier",
                        },
                    },
                ],
            }),
        });
    }
}
function GamePeriod(game) {
    if (game.period > 4)
        return `${game.period - 4 === 1 ? "" : game.period - 4}OT`;
    else
        return `${game.period}Q`;
}
