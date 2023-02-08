const heading = `
<div id="mw-head-base" class="noprint" style="height: 100px; display: flex; flex-direction: row;">
    <img src="../wiki-races/logo.png" height="95px">
    <h1 style="border-bottom: 0; padding: 35px;">Wiki Races 2023</h1>
</div>
`;

async function addHeadingToContent(content) {
	content = content.replace(/<div id="mw-head-base".*<\/div>/, heading);
	return content;
}

async function fillTemplate(content, id) {
	content = await addHeadingToContent(content);
	return `
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]>      <html class="no-js">        <![endif]-->

<html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="icon" type="image/x-icon" href="/wiki-races/favicon.png" />
    <title>INTERalliance Wiki Races</title>
    <meta name="description"
        content="A website to host challenges where people try to get from one wikipedia page to another, as quick as possible.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../wiki.css">
</head>

<body>

    ${content}

    <center style="padding: 1em; padding-bottom: 4.5em;">
        This page uses material from
        the Wikipedia article <u>https://en.wikipedia.org/wiki/${id}</u>
        which is released under the Creative Commons
        Attribution-Share-Alike License 3.0. <br />
        A copy of this license can be found at <u>https://creativecommons.org/licenses/by-sa/3.0/</u>. </br>
        This article was procedurally modified to remove content that would hurt the game experience.
    </center>
</body>

</html>
`;
}

module.exports = {
	fillTemplate,
};
