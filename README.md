<h1 align="center">homestuck annotator</h1>

<p align="center">
  <b>&gt; annotate homestuck.com. pass the notes around.</b>
</p>

<p align="center">
  works in chrome, firefox, and zen
</p>

---

write notes on any homestuck.com page, quote the exact text you're talking about, and share your notes with other readers so they can add their own. pick a color, write your name once, and that's it.

## get it

1. click the green **Code** button at the top of this page, then **Download ZIP**
2. unzip it somewhere you won't delete it
3. follow the steps for your browser below

<details>
<summary><b>chrome</b></summary>

1. go to `chrome://extensions` and turn on **developer mode**
2. click **load unpacked** and pick the unzipped folder
3. open homestuck.com

</details>

<details>
<summary><b>firefox / zen</b></summary>

1. go to `about:debugging#/runtime/this-firefox`
2. click **load temporary add-on** and pick `manifest.json` from the unzipped folder
3. open homestuck.com

> [!NOTE]
> temporary add-ons get removed when the browser closes, so you'll have to load it again next time. your saved notes should stay, but export a backup anyway.

> [!TIP]
> if the button doesn't show up, open the extension's permissions and allow it on homestuck.com.

</details>

## how to use it

1. click **`> ANNOTATIONS`** in the bottom right of the page
2. type a username, and a hex color if you want one (like `#ff0000`). you only do this once
3. write notes on the page you're reading. they show up again whenever you come back to that page
4. select some text on the page and hit **`> QUOTE SELECTION`** to attach it to your note

## sharing notes

there's no server, everything is saved in your browser. sharing is done with files.

| button | what it does |
| --- | --- |
| `> EXPORT` | saves the current notebook as a `.json` file |
| `> IMPORT` | merges someone else's file into your browser |

you can write in any notes, not just your own. add your notes, export, and send it back. nothing gets doubled when you import.

## heads up

this is early and mostly untested, so expect bugs. homestuck.com is a vue single page app, so the extension watches the url to notice when you turn the page.

this extension is now supported for www.beyondcanon.com !

## credit

this extension was made by me, but the initial idea belongs to tori: https://spider.zone/
