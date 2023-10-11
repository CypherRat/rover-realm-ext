let state = {
  date: "",
  data: {},
};

chrome.runtime.onInstalled.addListener(() => {
  fetchAndStoreData();
  setAlarmForNextDay();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(["date"], ({ date }) => {
    console.log(date);
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) {
      fetchAndStoreData();
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "daily") {
    fetchAndStoreData();
    setAlarmForNextDay();
    chrome.storage.local.set({ alarmTriggered: true });
    chrome.runtime.sendMessage({ alarmTriggered: true }, (response) => {
      console.log(chrome.runtime.lastError.message ?? "Message sent");
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkAndFetchData") {
    chrome.storage.sync.get(["date"], ({ date }) => {
      const today = new Date().toISOString().split("T")[0];
      if (date !== today) {
        fetchAndStoreData().then((dataFetchSuccessfulStatus) => {
          sendResponse({ isSuccessful: dataFetchSuccessfulStatus });
        });
      }
    });
  }
  return true;
});

async function fetchAndStoreData() {
  const urls = [
    "https://woopsme.000webhostapp.com/rovers/api/roverEvents",
    "https://woopsme.000webhostapp.com/rovers/api/roverOfTheDay",
    "https://woopsme.000webhostapp.com/rovers/api/roversWand2WinQRs",
    "https://woopsme.000webhostapp.com/rovers/api/roversWand2WinWinners",
  ];

  const titles = [
    "events",
    "roverOfTheDay",
    "claimToEarn",
    "claimToEarnWinners",
  ];

  let dataFetchSuccessful = true;
  for (let i = 0; i < urls.length; i++) {
    try {
      const response = await fetch(urls[i]);
      if (!response.ok) throw new Error("Network response was not ok");
      const jsonData = await response.json();
      state.data[titles[i]] = { endpoint: urls[i], response: jsonData };
    } catch (error) {
      dataFetchSuccessful = false;
      console.log(`Fetch failed for ${titles[i]}, retrying...`);
      setTimeout(fetchAndStoreData, 10000);
      break;
    }
  }

  if (dataFetchSuccessful) {
    state.date = new Date().toISOString().split("T")[0];
    chrome.storage.sync.set(state);
  }
  return dataFetchSuccessful;
}

function setAlarmForNextDay() {
  const now = new Date();

  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );

  const delayInMinutes = Math.ceil((tomorrow - now) / (1000 * 60));

  chrome.alarms.create("daily", { delayInMinutes });
}
