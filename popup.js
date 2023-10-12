document.addEventListener("DOMContentLoaded", function () {
  const welcomeDiv = document.getElementById("welcome");
  const nameForm = document.getElementById("nameForm");
  const mainContentDiv = document.getElementById("content");
  const loadingDiv = document.getElementById("loading");
  const greetingDiv = document.getElementById("greeting");
  const editButton = document.getElementById("editButton");
  const nameInput = document.getElementById("nameInput");
  const progress = document.getElementById("progress");
  const countdown = document.getElementById("countdown");
  const goBackButton = document.getElementById("goBackButton");
  const formHeader = document.getElementById("formHeader");

  //   Content Specific Selectors
  const refreshButton = document.getElementById("refreshButton");
  const loadingDivText = document.getElementById("loading-text");

  const hamburger = document.getElementById("hamburger");
  const tabs = document.getElementById("tabs");
  const heading = document.getElementById("heading");
  const contentDiv = document.getElementById("contents");
  const header = document.getElementById("header");

  const sectionInfoTitle = document.getElementById("sectionInfoTitle");
  const sectionInfoTxt = document.getElementById("sectionInfoTxt");

  // Default Display
  nameForm.style.display = "none";
  loadingDiv.style.display = "none";
  mainContentDiv.style.display = "none";

  // Initializers
  let width = 0;
  let timeLeft = 5;

  tabs.style.right = "-200px";

  countdown.textContent = timeLeft - 1;

  const intervalId = setInterval(function () {
    if (width >= 100) {
      clearInterval(intervalId);
    } else {
      width += 25;
      progress.style.width = width + "%";
      timeLeft -= 1;
      if (timeLeft === 0 || timeLeft === 1) {
        countdown.textContent = "LFG!!";
        countdown.style.color = "#e5fe68";
      } else {
        countdown.textContent = timeLeft - 1;
      }
    }
  }, 1000);

  chrome.alarms.getAll((alarms) => {
    alarms.forEach((alarm) => {
      console.log(
        `Alarm "${alarm.name}" is scheduled to fire at ${new Date(
          alarm.scheduledTime
        )}.`
      );
      console.log(new Date());
    });
  });

  setTimeout(() => {
    welcomeDiv.style.opacity = "0";
    setTimeout(() => (welcomeDiv.style.display = "none"), 100);
    chrome.storage.sync.get(["name", "data"], renderData);
  }, 5000);

  // Click Functions
  nameForm.onsubmit = function (e) {
    e.preventDefault();
    chrome.storage.sync.set({ name: nameInput.value }, () => {
      nameForm.style.opacity = "0";
      setTimeout(() => {
        nameForm.style.display = "none";
        greetingDiv.textContent = "Hello, " + nameInput.value;
        mainContentDiv.style.display = "block";
        goBackButton.style.display = "block";
        setTimeout(() => (mainContentDiv.style.opacity = "1"), 10);
        chrome.storage.sync.get(["name", "data"], renderData);
      }, 100);
    });
  };

  editButton.onclick = function () {
    mainContentDiv.style.opacity = "0";
    setTimeout(() => {
      mainContentDiv.style.display = "none";
      nameForm.style.display = "flex";
      formHeader.textContent = "Update Alias";
      goBackButton.style.display = "block";
      setTimeout(() => (nameForm.style.opacity = "1"), 10);
    }, 100);
  };

  goBackButton.onclick = function (e) {
    e.preventDefault();
    nameForm.style.opacity = "0";
    setTimeout(() => {
      nameForm.style.display = "none";
      mainContentDiv.style.display = "block";
      setTimeout(() => (mainContentDiv.style.opacity = "1"), 10);
    }, 100);
  };

  //   addtional
  hamburger.addEventListener("click", () => {
    if (tabs.style.right === "0px") {
      tabs.style.right = "-200px";
      updateClass(mainContentDiv, "tabsActive", "remove");
    } else {
      tabs.style.right = "0px";
      updateClass(mainContentDiv, "tabsActive");
    }
  });

  //   Click outside of sidebar to close it
  window.addEventListener("click", (event) => {
    if (
      event.target !== tabs &&
      event.target !== hamburger &&
      tabs.style.right === "0px"
    ) {
      tabs.style.right = "-200px";
      updateClass(mainContentDiv, "tabsActive", "remove");
    }
  });

  const updateClass = (element, className, action = "add") => {
    if (action === "add") {
      if (!element.classList.contains(className)) {
        element.classList.add(className);
      }
    } else if (action === "remove") {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    }
  };

  const renderData = ({ name, data }) => {
    console.log(data, "k");
    if (!name) {
      nameForm.style.display = "flex";
      goBackButton.style.display = "none";
      setTimeout(() => (nameForm.style.opacity = "1"), 10);
      return;
    }

    if (Object.keys(data || {}).length === 0) {
      loadingDiv.style.display = "flex";
      setTimeout(() => (loadingDiv.style.opacity = "1"), 10);
      return;
    }

    nameInput.value = name;
    mainContentDiv.style.display = "block";
    greetingDiv.textContent = "Hello, " + name + "!!";
    goBackButton.style.display = "block";
    setTimeout(() => (mainContentDiv.style.opacity = "1"), 10);

    nameForm.style.display = "none";
    loadingDiv.style.display = "none";
    header.style.display = "flex";
    tabs.style.display = "flex";

    let firstTabButton;

    for (const [title, { endpoint, response }] of Object.entries(data)) {
      const tab = document.createElement("div");
      tab.textContent = camelToCapitalized(title);
      tab.id = title;
      contentDiv.textContent = "";

      tab.addEventListener("click", () => {
        heading.textContent = camelToCapitalized(title);
        contentDiv.textContent = JSON.stringify(response, null, 2);

        const contentNode = createContentNode(title, response);
        contentDiv.innerHTML = "";
        contentDiv.appendChild(contentNode);

        tabs.style.right = "-200px";
        updateClass(mainContentDiv, "tabsActive", "remove");
        contentDiv.style.marginRight = "0";
        const activeTab = document.querySelector(".active-tab");
        if (activeTab) activeTab.classList.remove("active-tab");
        tab.classList.add("active-tab");
      });

      tabs.appendChild(tab);

      if (!firstTabButton) {
        if (title === "roverOfTheDay") {
          firstTabButton = tab;
        }
      }
    }

    firstTabButton.click();
    firstTabButton.classList.add("active-tab");
  };

  refreshButton.addEventListener("click", () => {
    loadingDivText.textContent = "Please wait, refreshing...";
    setTimeout(() => (loadingDivText.textContent = ""), 2500);
    chrome.runtime.sendMessage({ action: "checkAndFetchData" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      } else {
        console.log("Message sent");
        if (response && response.isSuccessful) {
          chrome.storage.sync.get(["name", "data"], renderData);
        }
      }
    });
  });

  chrome.storage.local.get(["alarmTriggered"], function (result) {
    console.log(result, "b");
    if (result.alarmTriggered) {
      chrome.storage.sync.get(["name", "data"], renderData);
      chrome.storage.local.set({ alarmTriggered: false });
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request, "ALARM FIRED");
    if (request.alarmTriggered) {
      chrome.storage.sync.get(["name", "data"], renderData);
      chrome.storage.local.set({ alarmTriggered: false });
    }
  });
});

function camelToCapitalized(camelCase) {
  let result = camelCase.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function createContentNode(title, response) {
  let template;
  let clone;

  template = document.querySelector(`#${title}Temp`);
  clone = template.content.cloneNode(true);

  sectionInfoTitle.textContent = `What is this ${camelToCapitalized(title)}?`;

  let originalSectionInfoText =
    'Read more details about the contest <a href="https://t.me/RoverRealm" target="_blank" rel="noopener noreferrer" class="text-green-200 hover:text-green-300">here</a>.';
  let newSectionInfoText = response?.description;
  sectionInfoTxt.innerHTML = newSectionInfoText ?? originalSectionInfoText;

  if (title === "roverOfTheDay") {
    clone.querySelector('[data-id="image"]').src = response?.image;
    clone.querySelector('[data-id="title"]').textContent = response?.name
      .replace("RoverRealm", "")
      .trim();
    clone.querySelector('[data-id="roverId"]').textContent = response?.name;
    const linkElement = clone.querySelector('[data-id="link"]');
    linkElement.href = "https://xoxno.com/buy/RoverRealm/RRLM";
    linkElement.textContent = "Buy Rover";
  } else if (title === "events") {
    clone = populateEvents(template, response);
  } else if (title === "claimToEarn") {
    clone = cloneTemplate2(template, response);
  } else if (title === "claimToEarnWinners") {
    clone.querySelector('[data-id="content"]').textContent =
      JSON.stringify(response);
  }

  return clone;
}

function cloneTemplate(template, data) {
  const clone = template.content.cloneNode(true);
  const slider = clone.querySelector('[data-id="slider"]');
  const p = clone.querySelector('[data-id="p"]');
  const claimButton = clone.querySelector('[data-id="claim"]');
  const prevButton = clone.querySelector('[data-id="prev"]');
  const nextButton = clone.querySelector('[data-id="next"]');
  const dateTitle = clone.querySelector('[data-id="date"]');

  // Create images for the slider
  data.forEach((item, i) => {
    const img = document.createElement("img");
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://woopsme.000webhostapp.com/rovers/interact/claimWand2Win?claim_id=${item.claim_id}`;
    img.classList.add("w-full", "h-64", "object-cover");
    if (i !== 0) img.style.display = "none";
    slider.appendChild(img);
  });

  p.textContent = `Rover Edition Number: ${data[0].roverEditionNumber}`;
  claimButton.onclick = () =>
    (window.location.href = `https://woopsme.000webhostapp.com/rovers/interact/claimWand2Win?claim_id=${data[0].claim_id}`);
  dateTitle.textContent = data[0].date;
  // Slider functionality
  let currentSlide = 0;
  const slides = Array.from(slider.children);
  startSlider(slides, currentSlide);

  prevButton.onclick = () => {
    currentSlide--;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    updateSlides(slides, currentSlide);
    updateData(data[currentSlide]);
  };

  nextButton.onclick = () => {
    currentSlide++;
    if (currentSlide >= slides.length) currentSlide = 0;
    updateSlides(slides, currentSlide);
    updateData(data[currentSlide]);
  };

  function updateData(item) {
    p.textContent = `Rover Edition Number: ${item.roverEditionNumber}`;
    claimButton.onclick = () =>
      (window.location.href = `https://example.com/claim/${item.claim_id}`);
    dateTitle.textContent = item.date;
  }

  return clone;
}

// function populateEvents(template, events) {
//   var fragment = document.createDocumentFragment();
//   events.forEach(function (event) {
//     var clone = document.importNode(template.content, true);

//     clone.querySelector("[data-id=title]").textContent = event.title;
//     clone.querySelector("[data-id=description]").textContent =
//       event.description;
//     clone.querySelector("[data-id=status]").textContent = event.status;
//     clone.querySelector("[data-id=timeline]").textContent = event.timeline;
//     clone.querySelector("[data-id=url]").href = event.url;

//     fragment.appendChild(clone);
//   });

//   return fragment;
// }
function populateEvents(template, events) {
  let fragmentWrapper = document.createElement("div");
  var fragment = document.createDocumentFragment();

  fragmentWrapper.classList.add("flex", "flex-col", "space-y-4");

  events.sort(function (a, b) {
    if (a.status === "ongoing") return -1;
    if (b.status === "ongoing") return 1;
    if (a.status === "upcoming") return -1;
    if (b.status === "upcoming") return 1;
    return 0;
  });

  events.forEach(function (event) {
    var clone = document.importNode(template.content, true);

    var bgColor;
    var textColor;
    var dotColor;
    var timelineBgColor;
    switch (event.status) {
      case "ongoing":
        bgColor = "bg-green-100";
        timelineBgColor = "bg-green-200";
        textColor = "text-green-800";
        dotColor = "bg-green-500";
        break;
      case "upcoming":
        bgColor = "bg-yellow-100";
        timelineBgColor = "bg-yellow-200";
        textColor = "text-yellow-800";
        dotColor = "bg-yellow-500";
        break;
      case "ended":
        bgColor = "bg-red-100";
        timelineBgColor = "bg-red-200";
        textColor = "text-red-800";
        dotColor = "bg-red-500";
        break;
    }

    clone.querySelector("[data-id=event]").classList.add(bgColor);
    clone
      .querySelector("[data-id=timeline]")
      .classList.add(timelineBgColor, textColor);
    clone.querySelector("[data-id=status-dot]").classList.add(dotColor);

    clone.querySelector("[data-id=title]").textContent = event.title;
    clone.querySelector("[data-id=description]").textContent =
      event.description;
    clone.querySelector("[data-id=status]").textContent = event.status;
    clone.querySelector("[data-id=timeline]").textContent = event.timeline;
    clone.querySelector("[data-id=url]").href = event.url;
    clone
      .querySelector("[data-id=url]")
      .addEventListener("click", function (e) {
        e.preventDefault();
        window.open(event.url, "_blank");
      });

    fragment.appendChild(clone);
  });

  fragmentWrapper.appendChild(fragment);

  return fragmentWrapper;
}

function startSlider(slides, currentSlide) {
  updateSlides(slides, currentSlide);
  setTimeout(() => startSlider(slides, currentSlide), 5000); // Change slide every 5 seconds
}

function updateSlides(slides, currentSlide) {
  slides.forEach((slide, i) => {
    slide.style.display = i === currentSlide ? "block" : "none";
  });
}

function cloneTemplate2(template, data) {
  const clone = template.content.cloneNode(true);
  const slider = clone.querySelector('[data-id="slider"]');
  const p = clone.querySelector('[data-id="p"]');
  const claimButton = clone.querySelector('[data-id="claim"]');
  const prevButton = clone.querySelector('[data-id="prev"]');
  const nextButton = clone.querySelector('[data-id="next"]');
  // const dateTitle = clone.querySelector('[data-id="date"]');

  // Create images for the slider
  data.forEach((item, i) => {
    const img = document.createElement("img");
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=2c2c2c&data=https://woopsme.000webhostapp.com/rovers/interact/claimWand2Win?claim_id=${item.claim_id}`;
    img.classList.add("w-full", "h-full", "object-contain");
    if (i !== 0) img.style.display = "none";
    slider.appendChild(img);
  });

  p.textContent = `Rover Edition Number: ${data[0].roverEditionNumber}`;
  claimButton.onclick = () =>
    (window.location.href = `https://woopsme.000webhostapp.com/rovers/interact/claimWand2Win?claim_id=${data[0].claim_id}`);
  // dateTitle.textContent = data[0].date;

  // Slider functionality
  let currentSlide = 0;
  let isHovered = false;
  const slides = Array.from(slider.children);

  slider.addEventListener("mouseover", () => (isHovered = true));
  slider.addEventListener("mouseout", () => (isHovered = false));

  startSlider(slides, currentSlide);

  prevButton.onclick = () => {
    currentSlide--;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    updateSlides(slides, currentSlide);
    updateData(data[currentSlide]);
  };

  nextButton.onclick = () => {
    currentSlide++;
    if (currentSlide >= slides.length) currentSlide = 0;
    updateSlides(slides, currentSlide);
    updateData(data[currentSlide]);
  };

  function updateData(item) {
    p.textContent = `Rover Edition Number: ${item.roverEditionNumber}`;
    claimButton.onclick = () =>
      window.open(
        `https://woopsme.000webhostapp.com/rovers/interact/claimWand2Win?claim_id=${item.claim_id}`
      );
    // dateTitle.textContent = item.date;
  }

  function startSlider(slides, currentSlide) {
    if (!isHovered) {
      updateSlides(slides, currentSlide);
      updateData(data[currentSlide]);
      currentSlide++;
      if (currentSlide >= slides.length) currentSlide = 0;
    }
    setTimeout(() => startSlider(slides, currentSlide), 30000); // Change slide every 30 seconds
  }

  function updateSlides(slides, currentSlide) {
    slides.forEach((slide, i) => {
      slide.style.display = i === currentSlide ? "block" : "none";
    });
  }

  return clone;
}
