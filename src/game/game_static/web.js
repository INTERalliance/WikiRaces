/**
 * This is a statically-loaded script that run's in the clients browser
 * when viewing any page
 */


if ((localStorage.theme == undefined) && (window.matchMedia("(prefers-color-scheme: dark)").matches)) {
	theme("dark")
}
else if (localStorage.theme == undefined) {
	theme("light")
}


//Checks if the user has already turned on Dark Mode.
if (localStorage.theme == "dark") {
    theme("dark")
}
else if (localStorage.theme == "light") {
    theme("light")
}



//This function switches Dark Mode on and off.
function theme(theme) {
    //DARK MODE
	if ((theme == undefined) && (localStorage.theme == "dark")) {
		theme = "light"
	}
	else if (theme ==  undefined) {
		theme = "dark"
	}
    if (theme == "dark") {
        document.querySelector("body").className = "dark"
		document.getElementById("change-theme-button").className = `fa fa-moon-o fa-3x`
        localStorage.theme = "dark"
    }
    //LIGHT MODE
    else if (theme == "light") {
        localStorage.theme = "light"
        document.querySelector("body").className = "light"
        document.getElementById("change-theme-button").className = `fa fa-sun-o fa-3x`


    }
}

if (document.getElementById("go-leaderboard")) {
	document.getElementById("go-leaderboard").addEventListener("click", () => {
		window.location.href = `${window.location.protocol}//${window.location.host}/wiki-races/leaderboard`;
	});
}

if (document.getElementById("go-home")) {
	document.getElementById("go-home").addEventListener("click", () => {
		window.location.href = `${window.location.protocol}//${window.location.host}/wiki-races/`;
	});
}
