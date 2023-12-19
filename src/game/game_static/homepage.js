/**
 * This is a statically-loaded script that run's in the clients browser
 * when viewing the main page (`/wiki-races/`)
 */

const LEVELS_CONTAINER_CLASS_NAME = "levels-table";
const LEVELS_TABLE_CLASS_NAME = "levels-table-data";
const LEVELS_ROW_CLASS_NAME = "levels-data-row";
const LEVEL_STATUS_TEXT_CLASS_NAME = "level-status-text";

function getTextFrom(url) {
	var resp;
	var xmlHttp;

	/* XML Request on main thread is a bad idea. */
	resp = "";
	xmlHttp = new XMLHttpRequest();

	if (xmlHttp != null) {
		xmlHttp.open("GET", url, false);
		xmlHttp.send(null);
		resp = xmlHttp.responseText;
	}
	return resp;
}

function generateURL(path) {
	return `${window.location.protocol}//${window.location.host}${path}`;
}

async function getJsonData() {
	const levelsURL = generateURL("/wiki-races/levels.json");
	const resp = getTextFrom(levelsURL);
	return JSON.parse(resp);
}

/**
 * creates an elipse element for use in the level button
 * @param {boolean} active - true when the button represents the current level. 
 * false when the button represents a past or future level.
 * @param {boolean} top - true when this elipse is the top of the button.
 * false when this elipse is the bottom of the button.
 * @returns {SVGEllipseElement}
 */
function createElipse(active, top) {
	const elipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
	elipse.setAttribute("cx", 39.5); // magic numbers from Figma design
	elipse.setAttribute("rx", 39.5);
	elipse.setAttribute("ry", 25.5);
	if (active) {
		elipse.classList.add("active-button");
	} else {
		elipse.classList.add("inactive-button");
	}
	if (top) {
		elipse.classList.add("button-top");
		elipse.setAttribute("cy", 32.5); // magic number from Figma
	} else {
		elipse.classList.add("button-bottom");
		elipse.setAttribute("cy", 25.5); // magic number from Figma
	}
	return elipse;
}

/**
 * Creates a clickable button element to take a user to the level
 * @param {number} number - the index in the list of levels
 * @param {string} link - what should this button link to?
 * @param {boolean} active - is this the current level?
 * @returns {SVGElement} svg of button
 */
function createButton(number, link, active) {
	const BUTTON_WIDTH = 79; // exported from figma
	const BUTTON_HEIGHT = 85;
	/**
	 * @type {SVGElement}
	 */
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("height", BUTTON_HEIGHT);
	svg.setAttribute("width", BUTTON_WIDTH);
	svg.setAttribute("viewBox", `0 0 ${BUTTON_WIDTH} ${BUTTON_HEIGHT}`);
	svg.setAttribute("fill", "none");

	// create elipses for button effect
	const topElipse = createElipse(active, true);
	svg.appendChild(topElipse);
	const bottomElipse = createElipse(active, false);
	svg.appendChild(bottomElipse);

	// create text element representing current level number
	const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	text.setAttribute("x", "45%");
	text.setAttribute("y", "45%");
	text.classList.add('button-text')
	if (active) {
		text.classList.add('active-button')
	} else {
		text.classList.add('inactive-button')
	}
	text.textContent = number.toString();
	svg.appendChild(text);
	return svg;
}

function createTableHeading() {
	let element = document.createElement("tr");
	let numbers = document.createElement("th");
	numbers.textContent = "#";
	numbers.className = "align-left";
	let links = document.createElement("th");
	links.textContent = "Links:";
	links.className = "align-left";

	let time = document.createElement("th");
	time.textContent = "Starts in:";
	time.className = "align-right";

	element.appendChild(numbers);
	element.appendChild(links);
	element.appendChild(time);

	return element;
}

function nameToURL(name) {
	return generateURL(`/wiki-races/game/${name}`);
}

function getIdFromName(name) {
	return `time-${name}`;
}

/**
 * Creates a `tr` element for the list of levels. 
 * Includes two columns:
 * - a button to click
 * - how long to the next level / "In progress" / "Complete"
 *
 * The tr element will take the [dataset](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*)
 * attributes `startTime` and `endTime`.
 * @param {number} number - zero indexed level number
 * @param {string} levelName - name of the level (e.g. level1, level23, etc)
 * @param {string} startTime - ISO8601 time string when the level starts
 * @param {string} endTime - ISO8601 time string when the level ends
 * @returns {HTMLTableRowElement}
 */
function createTableLine(number, levelName, startTime, endTime) {
	const element = document.createElement("tr");
	element.className = LEVELS_ROW_CLASS_NAME;
	element.dataset.startTime = startTime;
	element.dataset.endTime = endTime;

	const button = document.createElement("td");
	const url = nameToURL(levelName);
	number++; // account for zero indexing
	button.appendChild(createButton(number, url, false));
	button.className = "align-left";

	let links = document.createElement("td");

	let time = document.createElement("span");
	// time.href = url;
	time.classList.add("align-right", LEVEL_STATUS_TEXT_CLASS_NAME);
	time.id = getIdFromName(levelName);

	element.appendChild(button);
	element.appendChild(links);
	links.appendChild(time);

	return element;
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

/**
 * Returns the server time calculated via the offset determined on page load.
 * This is important because the device time may be different than the server time,
 * and we want all clients to start levels at the same time.
 * @returns {Date}
 * @see setServerOffset()
 */
function getTime() {
	var date = new Date();

	date.setTime(date.getTime() + offset);

	return date;
}

// Returns an s if the number is not 1
function s(number) {
	return number === 1 ? "" : "s";
}

/**
 * Takes a level's start time, and returns a human-readable
 * string saying how soon it starts.
 * @param {Date} startTime - time when the level starts
 * @returns {string} 
 */
function getTimeString(startTime) {
	const date = getTime();
	let seconds = (startTime - date) / 1000;
	const minutes = Math.floor(seconds / 60);
	seconds = seconds - minutes * 60;

	if (minutes > 5) {
		return `${minutes} minutes`;
	} else if (minutes > 0) {
		const secs = Math.round(seconds);
		return `${minutes} minute${s(minutes)} ${secs} sec${s(secs)}`;
	} else {
		return `${Math.round(seconds)} sec`;
	}
}

/**
 * Is the current server time between the two provided time stamps?
 * @param {Date} startTime - time when the level starts
 * @param {Date} endTime - time when the level ends
 * @returns {"past" | "present" | "future"} startTime <= user time < endTime
 */
function getLevelStatus(startTime, endTime) {
	if (getTime() - startTime >= 0) {
		if (getTime() - endTime >= 0) {
			return "past"; // level is completely over
		} else {
			return "present"; // level is in-progress
		}
	}
	return "future"; // level is in the future;
}

/**
 * This function loops through the rows in the table created by createLevelsTable.
 * It updates them as in the "past", "present", or "future" with the times set on page load.
 * Note that if the `levels.json` file is updated after the page has loaded,
 * this will not be detected by the page. A page refresh would be required.
 * @see createLevelsTable()
 */
function updateTimes() {
	const levelRows = document.getElementsByClassName(LEVELS_ROW_CLASS_NAME);
	// set each row's level status to "past", "present", or "future"
	for (const row of levelRows) {
		const startTime = Date.parse(row.dataset.startTime);
		const endTime = Date.parse(row.dataset.endTime);
		row.dataset.levelStatus = getLevelStatus(startTime, endTime);
	}

	// set the past levels display as "complete"
	const pastLevels = document.querySelectorAll(`[data-level-status="past"] .${LEVEL_STATUS_TEXT_CLASS_NAME}`);
	for (const pastLevel of pastLevels) {
		pastLevel.textContent = "Complete";
	}

	// set the current levels to "in progress"
	const presentLevels = document.querySelectorAll(`[data-level-status="present"] .${LEVEL_STATUS_TEXT_CLASS_NAME}`);
	for (const presentLevel of presentLevels) {
		presentLevel.textContent = "In progress!";
	}

	// set the future levels to say how far they are into the future
	const futureLevels = document.querySelectorAll(`[data-level-status="future"]`);
	for (const futureLevelRow of futureLevels) {
		const futureLevelText = futureLevelRow.getElementsByClassName(LEVEL_STATUS_TEXT_CLASS_NAME)[0];
		const startTime = Date.parse(futureLevelRow.dataset.startTime);
		futureLevelText.textContent = getTimeString(startTime);
	}
}

async function sendData(data) {
	const url = generateURL("/submit-username");
	const method = "POST";

	const request = new XMLHttpRequest();

	request.onload = () => {
		console.log(`Debug: Sent Data: ${request.status}`); // HTTP response status, e.g., 200 for "200 OK"
		console.log(JSON.stringify(data));
	};

	request.open(method, url, true);

	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	// Actually sends the request to the server.
	request.send(JSON.stringify(data));
}

function isValidUsername(content) {
	let error = document.getElementById("input-error");
	if (content.toLowerCase() === "[object object]") {
		error.textContent = "That's just mean.";
		error.className = "input-status-error";
		return false;
	} else if (
		// Name is invalid if:

		// name is just whitespace:
		content.match(/^\s+$/) ||
		// name is not of the range letters, diacritics, and space:
		!content.match(/^[a-zA-ZÀ-ž\u0370-\u03FF\u0400-\u04FF ]*$/g) ||
		// name is not filled out:
		content.length < 1 ||
		// name is too long:
		content.length > 20 ||
		// name is falsy:
		!content
	) {
		error.textContent =
			"Not a valid name. Please use only letters and spaces.";
		error.className = "input-status-error";
		return false;
	} else {
		error.textContent = "Submitted.";
		error.className = "input-status-good";
		return true;
	}
}

function dec2hex(dec) {
	return dec.toString(16).padStart(2, "0");
}

function getUserID(len = 40) {
	const arr = new Uint8Array(len / 2);
	window.crypto.getRandomValues(arr);
	return Array.from(arr, dec2hex).join("");
}

function setCookie(name, userId) {
	let d = new Date();
	const days = 2; // Days to expire
	d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `username=${name}; expires=${d.toUTCString()}; path=/;`;
	document.cookie = `userId=${userId}; expires=${d.toUTCString()}; path=/;`;
	console.log(document.cookie);
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

async function attemptToSubmitUsername() {
	let content = document.getElementById("submission-box").value;
	if (!isValidUsername(content)) return undefined;

	userId = getUserID();

	sendData({
		name: content,
		userId: userId,
		time: getTime(),
	});
	console.log("Set cookie");
	setCookie(content, userId);
	displayName();
}

/**
 * This function relies on the "levels-table" table existing in the page.
 * If it does exist, this function will fetch `levels.json` from game_static, and 
 * then append a table row for each level. Each table row will have the appropriate
 * `startTime` and `endTime` dataset attributes, which will be referenced by `updateTimes`.
 */
async function createLevelsTable() {
	const levels = Object.values(await getJsonData());
	const levelsDiv = document.getElementById(LEVELS_CONTAINER_CLASS_NAME);
	const table = document.createElement("table");
	table.className = LEVELS_TABLE_CLASS_NAME;
	for (let i = 0; i < levels.length; i++) {
		const level = levels[i];
		table.append(createTableLine(i, level.name, level.startTime, level.endTime));
	}
	levelsDiv.append(table);
}

(async () => {
	await createLevelsTable(); // run asynchronously on page load
	updateTimes();
})()

setInterval(() => {
	updateTimes();
}, 1000); // update the times every second

// Submit when button is pressed:
document
	.getElementById("submission-button")
	.addEventListener("click", attemptToSubmitUsername);

// Submit when enter is pressed:
document.getElementById("submission-box").addEventListener("keyup", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		attemptToSubmitUsername();
	}
});

// Hide all elements with given classname
function hideAll(className, hidden) {
	let elements = document.querySelectorAll(`.${className}`);

	for (let i = 0; i < elements.length; i++) {
		elements[i].style.display = hidden ? "none" : "inline";
	}
}

function showName() {
	hideAll("no-username", true);
	hideAll("has-username", false);
}

function showEntry() {
	hideAll("no-username", false);
	hideAll("has-username", true);
}

function displayName() {
	let username = getCookie("username");
	let userId = getCookie("userId");
	if (username && userId) {
		let nameBox = document.getElementById("username-value");
		nameBox.textContent = username;

		showName();
	} else {
		showEntry();
	}
}

displayName();

function logOut() {
	const understand = prompt(
		'If you log out, you will not be able to submit any more levels under this name. Type "I understand" to confirm ending this session.'
	);
	if (understand !== "I understand") {
		alert("Not logged out.");
		return undefined;
	}
	setCookie("", "");
	document.getElementById("submission-box").value = "";
	document.getElementById("input-error").textContent = "";
	displayName();
}

document.getElementById("delete-username").addEventListener("click", logOut);

document.body.onload = () => {
	document.getElementById("submission-box").focus();
};

document.getElementById("go-leaderboard").addEventListener("click", () => {
	window.location.href = `${window.location.protocol}//${window.location.host}/wiki-races/leaderboard`;
});