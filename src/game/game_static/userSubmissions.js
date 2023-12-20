/* This script displays detailed information about a user. */

document.getElementById("go-home").addEventListener("click", () => {
	window.location.href = `${window.location.protocol}//${window.location.host}`;
});

document.getElementById("go-leaderboard").addEventListener("click", () => {
	window.location.href = `${window.location.protocol}//${window.location.host}/wiki-races/leaderboard`;
});

/* Helper functions: */

function generateURL(path) {
	return `${window.location.protocol}//${window.location.host}${path}`;
}

function parseUserIdFromString(str) {
	const lastSlash = str.lastIndexOf("/") + 1;
	return str.slice(lastSlash);
}

function getIdFromUrl() {
	const url = window.location.pathname;
	return parseUserIdFromString(url);
}

async function getTextFrom(url) {
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

async function getUserData() {
	const pageUrl = window.location.pathname;
	const apiUrl = pageUrl.replace("/leaderboard", "/api/leaderboard");
	const resp = await getTextFrom(apiUrl);
	return JSON.parse(resp);
}

async function getLevelData() {
	const levelsURL = generateURL("/wiki-races/levels.json");
	const resp = await getTextFrom(levelsURL);
	return JSON.parse(resp);
}

async function setUserName(name) {
	const nameField = document.getElementById("display-name");
	nameField.textContent = name;
}

async function setNumCompleted(array) {
	const numberField = document.getElementById("num-of-levels");
	numberField.innerHTML = `<b>Number of levels completed:</b> ${array.length}`;
}

function titleField(title, content) {
	const p = document.createElement("p");
	p.innerHTML = `<b>${title}</b> ${content}`;
	return p;
}

// gets difference in milliseconds
function getDateDeltas(open, close) {
	const date = new Date(Date.parse(close) - Date.parse(open));
	return date.getTime();
}

function formatMS(milliseconds) {
	const date = new Date(Number(milliseconds));
	const m = date.getMinutes();
	const s = date.getSeconds();
	const ms = date.getMilliseconds();
	const plural = (x) => (x == 1 ? "" : "s");

	return `${m} minute${plural(m)} ${s}.${ms} seconds`;
}

function serialize(name) {
	return decodeURIComponent(name).replaceAll("_", " ");
}

/** From ./client.js */
// creates unordered list from array
function visualizeHistory(array) {
	// Create the list element:
	var list = document.createElement("ul");

	for (var i = 0; i < array.length; i++) {
		// Create the list items:
		var item = document.createElement("li");
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

function createHeader(text, level = 2) {
	const header = document.createElement(`h${level}`);
	header.textContent = `${text}:`;
	return header;
}

function createTextObject(text) {
	const p = document.createElement("p");
	p.textContent = `${text}`;
	return p;
}

function formatLevelStats(submission, levels) {
	const content = document.createElement("div");
	content.className = "submission-content";

	const duration = getDateDeltas(submission.levelOpen, submission.submitTime);
	const durationText = formatMS(duration);
	content.appendChild(titleField("Time:", durationText));

	content.appendChild(
		titleField("Total Links Visited:", `${submission.totalLinks}`)
	);
	return content;
}

async function generateDisplay(submission, levels) {
	const container = document.createElement("div");
	container.className = "submission";

	const level = levels[submission.levelName];
	const headerText = `${submission.levelName} (${serialize(
		level.startPage
	)} → ${serialize(level.endPage)})`;
	container.appendChild(createHeader(headerText));

	container.appendChild(formatLevelStats(submission));
	container.appendChild(createHeader("Direct path", 4));
	container.appendChild(visualizeHistory(submission.viewedPages));
	container.appendChild(createHeader("All pages visited", 4));
	container.appendChild(visualizeHistory(submission.fullHistory));

	return container;
}

async function setCompletedLevels(submissions) {
	const subContainer = document.getElementById("submissions-container");
	subContainer.innerHTML = "";
	const levels = await getLevelData();
	for (submission of submissions) {
		subContainer.append(await generateDisplay(submission, levels));
	}
}

/* Start Here: */

(async () => {
	userData = await getUserData();
	// The info in the heading (name, # levels completed):
	setUserName(userData.name);
	setNumCompleted(userData.submissions);
	// The info in the rest of the page:
	setCompletedLevels(userData.submissions);
})();
