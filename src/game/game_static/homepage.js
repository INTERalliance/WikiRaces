document.getElementById("go-leaderboard").addEventListener("click", () => {
	window.location.href = `${window.location.protocol}//${window.location.host}/wiki-races/leaderboard`;
});

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

	// create text
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

	/*
		<svg width="79" height="58" viewBox="0 0 79 58" fill="none" xmlns="http://www.w3.org/2000/svg">
			<ellipse cx="39.5" cy="32.5" rx="39.5" ry="25.5" class="active-button button-top" />
			<ellipse cx="39.5" cy="25.5" rx="39.5" ry="25.5" class="active-button button-bottom" />
			<text x="44%" y="55%" class="active-button button-text">1</text>
		</svg>
	 */
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

function createTableLine(number, content) {
	let element = document.createElement("tr");
	let numbers = document.createElement("td");
	number++;
	// TODO: fill in values
	numbers.appendChild(createButton(number, "https://example.com", true));
	// numbers.textContent = number.toString();
	numbers.className = "align-left";

	links = document.createElement("td");
	let link = document.createElement("a");

	url = nameToURL(content);
	//link.href = url;
	//link.textContent = `Level ${number}`;
	//link.className = "align-left";

	let time = document.createElement("a");
	time.href = url;
	time.className = "align-right";
	time.id = getIdFromName(content);

	//links.appendChild(link);
	element.appendChild(numbers);
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

function getTime() {
	var date = new Date();

	date.setTime(date.getTime() + offset);

	return date;
}

// Returns an s if the number is not 1
function s(number) {
	return number === 1 ? "" : "s";
}

function getTimeStringAndClass(levelStart, levelEnd) {
	const normal = "align-right";
	const urgent = "align-right status-urgent";
	const over = "align-right status-over";

	if (levelStart === undefined || levelEnd === undefined) return "";
	if (getTime() - levelStart >= 0) {
		if (getTime() - levelEnd >= 0) {
			return ["Complete", over]; // level is completely over
		} else {
			return ["In progress!", urgent];
		}
	}
	const date = getTime();
	let seconds = (levelStart - date) / 1000;
	let minutes = Math.floor(seconds / 60);
	seconds = seconds - minutes * 60;

	// Update time on screen
	if (minutes > 5) {
		return [`${minutes} minutes`, normal];
	} else if (minutes > 0) {
		const secs = Math.round(seconds);
		return [`${minutes} minute${s(minutes)} ${secs} sec${s(secs)}`, normal];
	} else {
		return [`${Math.round(seconds)} sec`, urgent];
	}
}

function updateTimes(levels) {
	const names = Object.keys(levels);

	for (level of names) {
		const div = document.getElementById(getIdFromName(level));
		const levelStart = Date.parse(levels[level].startTime);
		const levelEnd = Date.parse(levels[level].endTime);
		const info = getTimeStringAndClass(levelStart, levelEnd);
		const text = info[0];
		const className = info[1];
		div.textContent = text;
		div.className = className;
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

// Run at script load:

(async () => {
	const levels = await getJsonData();
	let levelsDiv = document.getElementById("levels-table");
	let table = document.createElement("table");
	//table.append(createTableHeading());

	const names = Object.keys(levels);
	for (let i = 0; i < names.length; i++) {
		table.append(createTableLine(i, names[i]));
	}
	levelsDiv.append(table);
})();

(async () => {
	const data = await getJsonData();
	updateTimes(data);
	setInterval(() => {
		updateTimes(data);
	}, 1000);
})();

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
