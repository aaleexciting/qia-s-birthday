(() => {
  "use strict";
  const body = document.body;
  const gate = document.getElementById("catGate");
  const form = document.getElementById("catGateForm");
  const input = document.getElementById("catGateAnswer");
  const status = document.getElementById("catGateStatus");
  const STORAGE_KEY = "qiaPrivateRewindUnlocked";
  if (!gate || !form || !input || !status) return;
  if (sessionStorage.getItem(STORAGE_KEY) === "yes") {
    body.classList.remove("is-locked");
    gate.hidden = true;
  } else {
    input.focus({ preventScroll: true });
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (input.value.trim().toLocaleLowerCase() === "dishwasher") {
      sessionStorage.setItem(STORAGE_KEY, "yes");
      body.classList.remove("is-locked");
      gate.hidden = true;
      status.textContent = "";
    } else {
      status.textContent = "Nope, the tiny cat bouncer says try again. ♡";
      input.value = "";
      input.focus();
    }
  });
})();
