/* client.js
 * This is the code that is loaded by `index.html`.
 * It is responsible for holding the wiki page in an iframe,
 * and monitoring the user's progress.
 */

function getTextFrom(url) {
	var resp;
	var xmlHttp;

	resp = "";
	xmlHttp = new XMLHttpRequest();

	if (xmlHttp != null) {
		xmlHttp.open("GET", url, false);
		xmlHttp.send(null);
		resp = xmlHttp.responseText;
	}
	return resp;
}

/* NOTE: This function runs on document load */
function getJsonData() {
	const levelsURL = generateURL("/wiki-races/levels.json");
	const resp = getTextFrom(levelsURL);
	return JSON.parse(resp);
}

const levels = getJsonData();

// Takes a string, returns after last `/` to end
function parseLevelFromString(str) {
	const lastSlash = str.lastIndexOf("/") + 1;
	return str.slice(lastSlash);
}

// returns the settings for the level if the URL is valid
// otherwise returns undefined
function getLevelSettings() {
	const levelName = parseLevelFromString(window.location.pathname);

	if (validLevel(levels[levelName])) {
		return levels[levelName];
	} else {
		return undefined;
	}
}

/* globally accessed variables: */
const settings = getLevelSettings();
const frame = document.getElementById("wikipedia-frame");
var viewedPages = [];
var fullHistory = [];
var totalLinks = 0;

function generateURL(path) {
	return `${window.location.protocol}//${window.location.host}${path}`;
}

function getCookie(cookieName) {
	let name = cookieName + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookies = decodedCookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		let c = cookies[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function sendData(data) {
	return new Promise((resolve) => {
		const url = generateURL("/submit");
		const method = "POST";

		const request = new XMLHttpRequest();

		request.onload = () => {
			console.log(`Debug: Sent Data: ${request.status}`); // HTTP response status, e.g., 200 for "200 OK"
			console.log(JSON.stringify(data));
			resolve();
		};

		request.open(method, url, true);

		request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

		// Actually sends the request to the server.
		request.send(JSON.stringify(data));
	});
}

async function endLevel() {
	let submitObject = {
		//TODO -
		levelName: settings.name,
		userId: getCookie("userId"),
		levelOpen: settings.startTime,
		submitTime: getTime(),
		viewedPages: viewedPages,
		fullHistory: fullHistory,
		totalLinks: totalLinks,
	};

	sendData(submitObject)
		.then(() => {
			console.log(submitObject);
		})
		.then(() => {
			window.location.href = generateURL("/wiki-races/levelComplete.html");
		});
}

/* NOTE: This function runs on document load */
var offset = 0;
function setServerOffset() {
	const dateURL = generateURL("/wiki-races/date");
	const serverDateString = getTextFrom(dateURL);

	let serverTime = Date.parse(
		new Date(Date.parse(serverDateString)).toUTCString()
	);
	let localTime = Date.parse(new Date().toUTCString());

	offset = serverTime - localTime;
}
setServerOffset();

function getTime() {
	var date = new Date();

	date.setTime(date.getTime() + offset);

	return date;
}

// Check if an object has all of the correct
// properties to be a level
function validLevel(level) {
	if (level === undefined) {
		return false;
	}
	if (
		level === levels[level.name] &&
		level.startTime !== undefined &&
		level.endTime !== undefined &&
		level.startPage !== undefined &&
		level.endPage !== undefined
	) {
		return true;
	}
	return false;
}

function goTo(page) {
	frame.src = `/wiki/${page}`;
}

// Returns an s if the number is not 1
function s(number) {
	return number === 1 ? "" : "s";
}

function setUpCountDown() {
	const level = getLevelSettings();
	const timer = document.getElementById("time-left");
	const endDate = Date.parse(level.endTime);

	if (endDate === undefined) return undefined;

	let timeLeft = setInterval(function () {
		function getCountdownString() {
			const date = getTime();
			const diff = endDate - date;
			const seconds = Math.floor(diff / 1000) % 60;
			const minutes = Math.floor((diff / 1000) / 60);
			const zeroPaddedSeconds = Math.round(seconds).toString().padStart(2, '0');
			return `${minutes}:${zeroPaddedSeconds}`;
		}

		console.log(timer.textContent, "timer.textContent");
		timer.textContent = getCountdownString();

		// Update time on screen

		// clear interval when time passes
		if (getTime() - endDate >= 0) {
			timer.textContent = `Time ran out. :(`;
			clearInterval(timeLeft);
			window.location.href = generateURL("/wiki-races/levelOver.html");
		}
	}, 200);
}

function startGame(level) {
	const error = document.getElementById("error-text");

	// Set iframe url:
	if (level !== undefined) {
		goTo(level.startPage);
		error.textContent = "";
	} else {
		error.textContent = "Invalid game url.";
	}
	viewedPages = [];

	// Set goal text:
	document.getElementById("goal").textContent = serialize(level.endPage);
}

// Sets Iframe location on script load, and when `reset` is clicked
function loadClient() {
	const level = getLevelSettings();
	const startDate = Date.parse(level.startTime);
	const error = document.getElementById("error-text");
	let countdown = setInterval(function () {
		const date = getTime();
		let seconds = (startDate - date) / 1000;
		let minutes = Math.floor(seconds / 60);
		seconds = seconds - minutes * 60;

		// Update time on screen
		if (minutes > 0) {
			error.textContent = `Starts in ${minutes} minute${s(
				minutes
			)} ${Math.round(seconds)} second${s(Math.round(seconds))}.`;
		} else {
			const timeLeft = Math.round(seconds * 10) / 10;
			error.innerHTML = `Starts in ${timeLeft} second${s(
				timeLeft
			)}. <br>	Goal: Go from <b>${serialize(
				level.startPage
			)}</b> to <b>${serialize(level.endPage)}</b><br><br>
			Remember that the goal is displayed in the top right.`;
		}

		// start game at correct time.
		if (getTime() - startDate >= 0) {
			startGame(level);
			clearInterval(countdown);
		}
	}, 100);
}

function submit() {
	endLevel();
}

// REVIEW - Rename these functions to something that makes more sense
/**
 * Take a raw wikipedia page id, and make it presentable to the user.
 * @param {string} name raw Wikipedia page ID
 * @returns {string} user presentable Wikipedia page name
 */
function serialize(name) {
	return decodeURIComponent(name).replaceAll("_", " ");
}

/**
 * Take a user presentable page name, and turn it into a raw wikipedia page id.
 * @param {string} name user presentable Wikipedia page name
 * @returns raw Wikipedia page ID
 */
function unSerialize(name) {
	return encodeURIComponent(name.replaceAll(" ", "_"));
}

// creates unordered list from array
function visualizeHistory(array) {
	// Create the list element:
	var list = document.createElement("div");

	for (var i = 0; i < array.length; i++) {
		// Create the list items:
		var item = document.createElement("div");
		item.className = "history-element";
		let border = document.createElement("span");
		border.className = "history-text";
		let text = document.createTextNode(serialize(array[i]));

		// append them
		border.appendChild(text);
		item.appendChild(border);
		list.appendChild(item);
	}

	// Finally, return the constructed list:
	return list;
}

function reverseHistory(goal) {
	let index = viewedPages.indexOf(goal);
	if (index < 0) return undefined;
	viewedPages.splice(index);
	goTo(goal);
}

function setHistory() {
	const frame = document.getElementById("history-frame");
	frame.innerHTML = visualizeHistory(viewedPages).innerHTML;
	const wrapper = document.getElementById("history-wrapper");
	wrapper.scrollLeft = 10000;
}

function kickIfNotLoggedIn() {
	if (getCookie("userId") === "") {
		window.location.href = generateURL("/wiki-races/notLoggedIn.html");
	}
}

/* Functions that run at script load: */
kickIfNotLoggedIn();
setUpCountDown();
loadClient();

document.getElementById("restart").addEventListener("click", loadClient);

// TODO - Run on Iframe start to load, not completion.
frame.addEventListener("load", async () => {
	const page = parseLevelFromString(frame.contentWindow.location.pathname);
	if (page === settings.endPage) {
		submit();
	}
	totalLinks++;
	if (page != viewedPages[viewedPages.length - 1]) {
		viewedPages.push(page);
		fullHistory.push(page);
	}
	setHistory();
});

// navigate to page when history is clicked
document.getElementById("history-frame").addEventListener("click", (ele) => {
	classClicked = ele.target.className;
	if (classClicked !== "history-text") {
		return undefined;
	}
	reverseHistory(unSerialize(ele.target.textContent));
});

setHistory();
