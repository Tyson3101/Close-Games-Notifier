const DesktopNotifications = document.querySelector("#DesktopNotifications");
const DiscordWebhooks = document.querySelector("#DiscordWebhooks");
const PopupNotifications = document.querySelector("#PopupNotifications");
getAllSettingsForPopup();
function getAllSettingsForPopup() {
    chrome.storage.sync.get(["desktopNotifications", "discordWebhooks", "popupNotifications"], function (result) {
        console.log(result);
        DesktopNotifications.checked = result.desktopNotifications;
        DiscordWebhooks.value = result.discordWebhooks.join("\n");
        PopupNotifications.checked = result.popupNotifications;
    });
}
DesktopNotifications.addEventListener("change", function () {
    chrome.storage.sync.set({ desktopNotifications: this.checked });
});
DiscordWebhooks.addEventListener("change", function () {
    chrome.storage.sync.set({ discordWebhooks: this.value.split("\n") });
});
PopupNotifications.addEventListener("change", function () {
    chrome.storage.sync.set({ popupNotifications: this.checked });
});
