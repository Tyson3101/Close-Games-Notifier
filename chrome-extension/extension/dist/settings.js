// Document Elements
const DesktopNotifications = document.querySelector("#DesktopNotifications");
const DiscordWebhooks = document.querySelector("#DiscordWebhooks");
const PopupNotifications = document.querySelector("#PopupNotifications");
// Settings Intialization
getAllSettingsForPopup();
function getAllSettingsForPopup() {
    chrome.storage.sync.get(["desktopNotifications", "discordWebhooks", "popupNotifications"], function (result) {
        DesktopNotifications.checked = result.desktopNotifications;
        PopupNotifications.checked = result.popupNotifications;
        showDiscordWebhooks(result.discordWebhooks);
    });
}
// Event Listeners
DesktopNotifications.addEventListener("change", function () {
    chrome.storage.sync.set({ desktopNotifications: this.checked });
});
PopupNotifications.addEventListener("change", function () {
    chrome.storage.sync.set({ popupNotifications: this.checked });
});
// Discord Webhooks
const DiscordWebhooksContainer = document.querySelector("#DiscordWebhooks");
function showDiscordWebhooks(discordWebhooks) {
    DiscordWebhooksContainer.innerHTML = "";
    if (discordWebhooks && discordWebhooks.length > 0) {
        discordWebhooks.forEach((discordWebhook, index) => {
            addDiscordWebhook(index, discordWebhook);
        });
        addDiscordWebhook(discordWebhooks.length);
    }
    else {
        addDiscordWebhook(0);
    }
}
function addDiscordWebhook(index, discordWebhook) {
    console.log("addDiscordWebhookToStorage", index, discordWebhook);
    const webhookHTML = `
    <div>
      <input
        type="text"
        class="discordWebhook"
        data-discordWebhookIndex=${index} ${!!discordWebhook ? "readonly" : ""} value="${discordWebhook || ""}"
      />
      <br /><button>Remove</button>
    </div>
  `;
    const webhookElement = document.createElement("li");
    webhookElement.innerHTML = webhookHTML;
    DiscordWebhooksContainer.appendChild(webhookElement);
    webhookElement.querySelector("button").addEventListener("click", () => {
        if (document.querySelectorAll(".discordWebhook").length > 1)
            webhookElement.remove();
        else
            webhookElement.querySelector("input").value = "";
        chrome.storage.sync.get(["discordWebhooks"], (result) => {
            const discordWebhooks = result.discordWebhooks;
            discordWebhooks.splice(index, 1);
            chrome.storage.sync.set({ discordWebhooks });
        });
    });
    webhookElement.querySelector("input").addEventListener("input", (e) => {
        chrome.storage.sync.get(["discordWebhooks"], (result) => {
            const newWebhook = webhookElement.querySelector("input").value;
            if (!newWebhook.includes("discord"))
                return;
            const discordWebhooks = result.discordWebhooks || [];
            discordWebhooks[index] = newWebhook;
            chrome.storage.sync.set({ discordWebhooks });
        });
    });
}
document
    .querySelector("button#addDiscordWebhook")
    .addEventListener("click", () => {
    chrome.storage.sync.get(["discordWebhooks"], (result) => {
        const discordWebhooks = result.discordWebhooks || [];
        chrome.storage.sync.set({ discordWebhooks });
        showDiscordWebhooks(discordWebhooks);
    });
});
