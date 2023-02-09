# Wiki Races

This is the repository for the INTERalliance WikiRaces competition at TechOlympics 2023.

Run `npm install` in the project directory to install the dependencies.

Run `npm run-script test` to run the test suites.

Run `npm run-script run` to host the site for testing.

On the actual server, use pm2 to start the server with `pm2 start app.js --name wikiRaces`

---

### About Wiki Races:

Wiki Races is a competition where players start on
a Wikipedia page, and have to get to another Wikipedia page
by only clicking the links in the Wikipedia pages.

---

### Website features:

- Homepage:
  - Display levels (from `levels.json`)
  - Submit usernames and userIds to server
- Client:
  - Loaded when links from the homepage are clicked.
  - Tracks user history
    - Visualises history at the bottom of the page
    - Can click on a history element to go back to that page
  - Submits user data (history, time, userId) to server when a level is completed.
- Leaderboard:
  - Orders all players by total time 
  - Has links to show players individual submissions
- Server:
  - Dynamically generate Wikipedia pages
  - Save user data
  - Host various APIs for webpages
- Admin tools:
  - Rename users on the fly
  - Set level times easily

---

This is intended to be run on a linux system. 
It has been proven to work on Ubuntu Server 20.04.2

This does not have any of the NGINX settings needed to support the server. 
You will need to do that yourself if you are setitng this up. 

---

### To do:

- clean up useless async/await
- set up replica sets for mongodb
- add informational text on homepage
	- note a re-direct does not count
- Add message for Edge and weird browsers
- encode urls properly
- Reorder directory structure so pages are not jumbled together.
- set up nojs and IE support
- set up Docker

----

<details>
  <summary>Completed tasks</summary>

## Completed:
- Cache all loaded files -> Store as JSON or as Files?
- Get Wikipedia content and parse it
- How to return content from function with expressjs?
- remove search boxes and extra stuff from page
- The main issue right now is that I am unable to detect when a link is clicked.
- Plan: Dynamically fetch wikipedia pages, and break out of the iframe to set variables.
- If I can host the page and the game, I shouldn't have issues with XSS
- Autogenerate [url](https://github.com/ElderINTERalliance/WikiRaces/blob/3d731bdac930a36299f17b73827c23e2dd1e2c54/src/game/game_static/client.js#L8)
- improve `if (err) return log.error(err);`
- set github language [with this](https://hackernoon.com/how-to-change-repo-language-in-github-c3e07819c5bb) [or this](https://stackoverflow.com/questions/34713765/github-changes-repository-to-wrong-language)
- create test suite
- due to xss, I cannot tell what url an iframe is on without hosting it.
- add more padding to the bottom of the navbar
- Add horizontal history view in bottom bar
- Before game starts, show timer
- Be able to detect what webpage the user is on.
	- How to get info from url?
- Time till completion should work by storing a date object at game start, and getting the delta at game over.
- Create game client
- Look into port forwarding with NGINX
- Get accurate times
- add level view to homepage
- make script to start in `n` minutes
- Forward `/` to `/wiki-races` with NGINX
- set up https with nginx and certbot
- Takes username in box
- generates userid
- Get backend capable of accepting submissions
- create homepage that allows users to register username
	- Submits userid with username to database
- create leaderboard that loads level data and views it.
- Get backend capable of accepting submissions
	- semi complete
- create homepage that allows users to register username
  - Submits userid with username to database
- make levels submit data on level clear
	- log that data to database
- make levels submit data on level clear
	- log that data to database
- create leaderboard that loads level data and views it.
- replace JSDOM with custom formatter
- add wikipedia attribution at the bottom of each page
- add https://wiki-races.interalliance.org with certbot
- fix css for small browsers
- Add link to go back to main page when we run out of time.
- Disable opening links in new tab?
- Nicely comment everything.
- get a good server hosting solution.
- Create homepage
- Create backend (hopefully something better than just a JSON file, but we'll see.)
- center leaderboard titles
- make script to redact names
- add css for `go to leaderboard` button on homepage
- make database connection a property of a database object.
- click to view user's submission info on leaderboard

</details>
