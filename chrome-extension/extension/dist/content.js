chrome.runtime.onMessage.addListener(({ type, game }, _, sendResponse) => {
    if (type !== "popupNotification")
        return false;
    console.log("Messaage reviceived from background.ts");
    const homeTeam = game.homeTeam;
    const awayTeam = game.awayTeam;
    const message = `CLOSE GAME ALERT!
     ${homeTeam.teamCity} ${homeTeam.teamName} <b>${homeTeam.score}</b> | <b>${awayTeam.score}</b> ${awayTeam.teamCity} ${awayTeam.teamName}<br/>
     ${game.gameClock} ${GamePeriod(game)}`;
    /*
    const message = `
      Dallas Mavericks <b>99</b> | <b>98</b> Chicago Bulls<br/>
     2:10 4Q`;
*/
    // Create and style the popup using HTML and CSS
    const popupHTML = `
    <div style="min-width: 500px; z-index:1000; position: fixed; top: 2%; right: 2%; color: black; background-color: #fff; border: 1px solid #ccc; padding: 10px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);">
      <h2>CLOSE GAME ALERT!</h2>
      <p style="font-size: 1.1em">${message}</p>
      <button id="closePopup" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; cursor: pointer;">Close</button>
    </div>
  `;
    // Append the popup to the document body
    const popupContainer = document.createElement("div");
    popupContainer.innerHTML = popupHTML;
    document.body.appendChild(popupContainer);
    // Close the popup when the "Close" button is clicked
    popupContainer
        .querySelector("#closePopup")
        .addEventListener("click", () => {
        document.body.removeChild(popupContainer);
    });
    return true;
});
