# omni-search
> A UI element for global searches

[![Build Status](https://travis-ci.org/pedrocatre/omni-search.png)](https://travis-ci.org/pedrocatre/omni-search)

## Demo

Default: [http://pedrocatre.com/omni-search/demo/index.html](http://pedrocatre.com/omni-search/demo/index.html)

Dark theme: [http://pedrocatre.com/omni-search/demo/dark-theme.html](http://pedrocatre.com/omni-search/demo/dark-theme.html)

## Use cases

Some use cases include adding quick navigation to your webapp so users can just jump to where they want to be
without leaving the keyboard or clicking several links. You can also provide a list of actions the user can perform in the application.

You just:

* Choose what triggers the global search to open, for example a keyboard shortcut
* Provide a list of search results
* Provide a callback to handle what happens when the item is clicked by the user

## Example project using omni-search

[WunderlistNavigator](https://github.com/pedrocatre/wunderlist-navigator/tree/feature/omni-search-lib),
quickly navigate between to-do lists in wunderlist.

![WunderlistNavigator](https://github.com/pedrocatre/wunderlist-navigator/raw/master/screenshots/demo.gif)

## Install

`npm install omni-search --save`

or

`bower install omni-search --save`

## Usage

1. Include jQuery:

	```html
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
	```

2. Include plugin's code and style:

	```html
	<link rel="stylesheet" href="dist/css/omni-search.css"/>
	<!--Optional dark theme-->
	<link rel="stylesheet" href="dist/css/omni-search.css"/>
	<script src="dist/js/omni.search.js"></script>
	```


3. Call the plugin by passing a list of search items and a callback when an item is triggered:

	```javascript
	var $search = $('#element').omniSearch();
	$search.omniSearch('open', searchItems, callback);
	```
	
### searchItems
	
You can pass any data you like in the searchItems. If you pass searchElementImgUrl to override the default icon for the element.

### callback
 
The callback gets passed all the data of the triggered element.

**Note:** omni-search handles the keys when it is open (arrow keys to navigate and `Enter to trigger an action)` but
it does not assume a keyboard shortcut to open the omni-search. If you want to open omni-search with a shortcut you must
add a library, for example: [mousetrap](https://github.com/ccampbell/mousetrap) or [keymaster](https://github.com/madrobby/keymaster).

### Example usage:

```javascript
// Call omni-search on an element
var $search = $('body').omniSearch();

var ALERT_TYPE = 'ALERT',
	NAVIGATE_TO_URL_TYPE = 'NAVIGATE_TO_URL',
	REPLACE_MSG_PLACEHOLDER_TYPE = 'REPLACE_MSG_PLACEHOLDER_TYPE';

// Create a list of search items
var searchItems = [
	{
		title: "Fork me on GitHub",
		type: NAVIGATE_TO_URL_TYPE,
		searchElementImgUrl: 'https://assets-cdn.github.com/pinned-octocat.svg' // overriding search element icon
	},
	{
		title: "Important action change placeholder text",
		type: REPLACE_MSG_PLACEHOLDER_TYPE,
		searchElementImgUrl: 'http://pedrocatre.com/omni-search/demo/assets/gear.png'
	},
	{
		title: "Trigger alert",
		type: ALERT_TYPE
	}
];

// Create a callback function that gets triggered when a search item is clicked or when it is selected
// and a user clicks Enter
var callback = function (activatedItemData) {
	switch (activatedItemData.type) {
		case REPLACE_MSG_PLACEHOLDER_TYPE:
			$('.msg-placeholder').text(activatedItemData.title);
			break;
		case NAVIGATE_TO_URL_TYPE:
			window.location.href = 'https://www.google.com';
			break;
		case ALERT_TYPE:
			alert('Activated item data ' + activatedItemData.title);
			break;
		default:
			alert('Unknown type');
	}

};

// On keyboard shortcut
key('⌘+⇧+y', function() {
	openOmniSearch()
});

// On click
$('button.open-search').click(function () {
	openOmniSearch();
});

function openOmniSearch() {
	console.log('open omni-search');
	$search.omniSearch('open', searchItems, callback);
}

````

## Methods

* `$search.omniSearch('open', searchItems, callback);` open omni-search
* `$search.omniSearch('close');` close omni-search

**Note:** there should not be many good reasons to call a method to close the omni-search since it already closes when:

* The user clicks out
* When a user triggers an action by clicking `Enter`or clicking the mouse.
* When the user presses `Esc

## Developing

Install dependencies by running:

`npm install`

Run `grunt build --force`to build the project (compile sass, minify css, concat javascript and uglify).

Install typescript `npm install -g typescript`

Run `tsc -w` to watch for typescript file changes.

### Run e2e-tests

Setup [nightwatchjs](http://nightwatchjs.org/getingstarted)

Nightwatch works with the Selenium standalone server so the first thing you need to do is download the selenium server jar file selenium-server-standalone-2.x.x.jar from the Selenium releases page: https://selenium-release.storage.googleapis.com/index.html

`npm install -g nightwatch`

Run `grunt serve` to serve the demo: http://localhost:9006/demo/index.html

Run `nightwatch`

## Credit

Inspired by the [TabSwitcher project](https://github.com/kamranahmedse/tab-switcher), a tab switcher for chrome.

## License

[MIT License](http://pedrodcatre.mit-license.org/) © Pedro Catré
