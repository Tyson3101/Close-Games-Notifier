// Document Elements
const toggleBtn = document.querySelector(".toggleBtn");
const DesktopNotifications = document.querySelector("#DesktopNotifications");
const DiscordWebhooks = document.querySelector("#DiscordWebhooks");
const PopupNotifications = document.querySelector("#PopupNotifications");
// Settings Intialization
getAllSettingsForPopup();
function getAllSettingsForPopup() {
    chrome.storage.sync.get([
        "desktopNotifications",
        "discordWebhooks",
        "popupNotifications",
        "applicationIsOn",
    ], function (result) {
        DesktopNotifications.checked = result.desktopNotifications;
        DiscordWebhooks.value = result.discordWebhooks.join("\n");
        PopupNotifications.checked = result.popupNotifications;
        changeToggleButton(result.applicationIsOn);
    });
}
// Event Listeners
DesktopNotifications.addEventListener("change", function () {
    chrome.storage.sync.set({ desktopNotifications: this.checked });
});
DiscordWebhooks.addEventListener("change", function () {
    chrome.storage.sync.set({ discordWebhooks: this.value.split("\n") });
});
PopupNotifications.addEventListener("change", function () {
    chrome.storage.sync.set({ popupNotifications: this.checked });
});
chrome.storage.onChanged.addListener((result) => {
    if (result["applicationIsOn"]?.newValue !== undefined) {
        changeToggleButton(result["applicationIsOn"].newValue);
    }
});
// Toggle Button
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
