(function () {
    'use strict';
    /**
     * Configuration constants for the extension
     *
     * @type {Object}
     */
    var Templates;
    (function (Templates) {
        Templates[Templates["MAIN_TEMPLATE"] = "<div class=\"omni-search\" style=\"display: none;\">\n\t\t\t\t\t<input type=\"text\">\n\t\t\t\t\t<ul class=\"search-results-list\">\n\t\t\t\t\t</ul>\n\t\t\t\t</div>"] = "MAIN_TEMPLATE";
        Templates[Templates["SEARCH_RESULT_ELEMENT_TEMPLATE"] = "<li class=\"search-result\">\n\t\t\t\t\t<span class=\"favicon-img\">\n\t\t\t\t\t<img src=\"{favicon}\" onerror=\"this.src='{default_favicon}';\">\n\t\t\t\t\t</span>\n\t\t\t\t\t<span class=\"title\">{title}</span>\n\t\t\t\t</li>"] = "SEARCH_RESULT_ELEMENT_TEMPLATE";
    })(Templates || (Templates = {}));
    ;
    var KeyCodes;
    (function (KeyCodes) {
        KeyCodes[KeyCodes["DOWN_KEY"] = 40] = "DOWN_KEY";
        KeyCodes[KeyCodes["UP_KEY"] = 38] = "UP_KEY";
        KeyCodes[KeyCodes["ESCAPE_KEY"] = 27] = "ESCAPE_KEY";
        KeyCodes[KeyCodes["ENTER_KEY"] = 13] = "ENTER_KEY";
    })(KeyCodes || (KeyCodes = {}));
    ;
    var Actions;
    (function (Actions) {
        Actions[Actions["GOING_UP"] = 'going_up'] = "GOING_UP";
        Actions[Actions["GOING_DOWN"] = 'going_down'] = "GOING_DOWN";
        Actions[Actions["ESCAPING"] = 'escaping'] = "ESCAPING";
        Actions[Actions["SWITCHING"] = 'switching'] = "SWITCHING";
    })(Actions || (Actions = {}));
    ;
    var Config = {
        // Default favicon to use
        DEFAULT_FAVICON: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAMklEQVR4AWMgEkT9R4INWBUgKX0Q1YBXQYQCkhKEMDILogSnAhhEV4AGRqoCTEhkPAMAbO9DU+cdCDkAAAAASUVORK5CYII=',
        // References to extension DOM elements
        SELECTED_CLASS: 'selected-search-result',
        SELECTED_SEARCH_RESULT_SELECTOR: '.selected-search-result',
        FAVICON_IMG_SELECTOR: '.favicon-img img',
        OMNI_SEARCH_SELECTOR: '.omni-search',
        SEARCH_RESULTS_LIST_SELECTOR: '.omni-search .search-results-list',
        SEARCH_RESULT_SELECTOR: '.search-result',
        SEARCH_INPUT_SELECTOR: '.omni-search input[type="text"]'
    };
    /**
     * Houses all the the search results
     *
     * @type array
     */
    var allSearchResults = [];
    var onActivateSearchItemCallback;
    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.
    // window and document are passed through as local variables rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).
    // Create the defaults once
    var pluginName = "omniSearch", defaults = {
        propertyName: "value"
    };
    // The actual plugin constructor
    function OmniSearch(element, options) {
        this.element = element;
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }
    /**
     * Moves the focus for the selected search result for the passed action
     *
     * @param action
     */
    function moveSearchResultFocus(action) {
        var $firstSelected = $(Config.SELECTED_SEARCH_RESULT_SELECTOR);
        // If some search result was already selected
        if ($firstSelected.length !== 0) {
            // Make it unselected
            $firstSelected.removeClass(Config.SELECTED_CLASS);
            var $toSelect = null;
            if (action === Actions.GOING_DOWN) {
                var $nextSelected = $firstSelected.next(Config.SEARCH_RESULT_SELECTOR);
                $toSelect = $nextSelected.length !== 0 ? $nextSelected : $(Config.SEARCH_RESULT_SELECTOR).first();
            }
            else if (action === Actions.GOING_UP) {
                var $prevSelected = $firstSelected.prev(Config.SEARCH_RESULT_SELECTOR);
                $toSelect = $prevSelected.length !== 0 ? $prevSelected : $(Config.SEARCH_RESULT_SELECTOR).last();
            }
            $nextSelected = $toSelect.addClass(Config.SELECTED_CLASS);
        }
        else {
            $nextSelected = $(Config.SEARCH_RESULT_SELECTOR).first().addClass(Config.SELECTED_CLASS);
        }
        $nextSelected.get(0).scrollIntoViewIfNeeded();
    }
    function populateSearchResults(searchResults) {
        var $searchResults = getSearchResultsHtml(searchResults);
        $(Config.SEARCH_RESULTS_LIST_SELECTOR).html($searchResults);
        $(Config.SEARCH_RESULT_SELECTOR).first().addClass(Config.SELECTED_CLASS);
    }
    /**
     * Generates HTML string for the passed array of objects
     *
     * @param search results
     * @returns {string}
     */
    function getSearchResultsHtml(searchResults) {
        var $searchResultsHtml = $('<span></span>');
        searchResults.forEach(function (searchResult) {
            var tempSearchResultsTemplate = Templates.SEARCH_RESULT_ELEMENT_TEMPLATE, faviconUrl = searchResult.favIconUrl || Config.DEFAULT_FAVICON;
            tempSearchResultsTemplate = tempSearchResultsTemplate.replace('{favicon}', faviconUrl);
            tempSearchResultsTemplate = tempSearchResultsTemplate.replace('{default_favicon}', Config.DEFAULT_FAVICON);
            tempSearchResultsTemplate = tempSearchResultsTemplate.replace('{title}', searchResult.title);
            var $searchResultTemplate = $(tempSearchResultsTemplate);
            $searchResultTemplate = $searchResultTemplate.data(searchResult);
            $searchResultsHtml.append($searchResultTemplate);
        });
        return $searchResultsHtml;
    }
    /**
     * Filters search results by the specified keyword string
     *
     * @param keyword
     */
    function filterSearchResults(keyword) {
        keyword = keyword.toLowerCase();
        var matches = [], textToFilterBy = '';
        allSearchResults.map(function (searchResult) {
            textToFilterBy = JSON.stringify(searchResult).toLowerCase();
            if (textToFilterBy.match(keyword)) {
                matches.push(searchResult);
            }
        });
        populateSearchResults(matches);
    }
    /**
     * Gets the action to be performed for the given keycode
     *
     * @param keyCode
     * @returns {*}
     */
    function getActionFor(keyCode) {
        switch (keyCode) {
            case KeyCodes.UP_KEY:
                return Actions.GOING_UP;
            case KeyCodes.DOWN_KEY:
                return Actions.GOING_DOWN;
            case KeyCodes.ESCAPE_KEY:
                return Actions.ESCAPING;
            case KeyCodes.ENTER_KEY:
                return Actions.SWITCHING;
            default:
                return false;
        }
    }
    function callItemAction($item) {
        var activatedItemData = $item.data();
        if (typeof onActivateSearchItemCallback === 'function') {
            // TODO fix should use apply $firstSelected[0]
            onActivateSearchItemCallback(activatedItemData);
        }
    }
    /**
     * Switches to the currently focused search result
     */
    function callSelectedItemAction() {
        var $firstSelected = $(Config.OMNI_SEARCH_SELECTOR).find(Config.SELECTED_SEARCH_RESULT_SELECTOR).first();
        callItemAction($firstSelected);
    }
    /**
     * Performs the action for the passed keypress event
     *
     * @param event
     */
    function handleKeyPress(event) {
        var action = getActionFor(event.keyCode);
        switch (action) {
            case Actions.GOING_UP:
            case Actions.GOING_DOWN:
                moveSearchResultFocus(action);
                break;
            case Actions.ESCAPING:
                $(Config.OMNI_SEARCH_SELECTOR).hide();
                break;
            case Actions.SWITCHING:
                callSelectedItemAction();
                break;
        }
    }
    function closeOmniSearch() {
        $(Config.OMNI_SEARCH_SELECTOR).hide();
        $(Config.SEARCH_INPUT_SELECTOR).val('');
    }
    function bindUi() {
        // mouse-down instead of click because click gets triggered after the blur event in which case omni-search
        // would already be hidden (@see blur event below) and click will not be performed
        $(document).on('mousedown', Config.SEARCH_RESULT_SELECTOR, function () {
            var $this = $(this);
            callItemAction($this);
        });
        // Hide the omni-search on blurring of input
        $(document).on('blur', Config.SEARCH_INPUT_SELECTOR, function () {
            closeOmniSearch();
        });
        $(document).on('keydown', Config.SEARCH_INPUT_SELECTOR, function (e) {
            // omni-search was visible and either down or up key was pressed
            if ($(Config.OMNI_SEARCH_SELECTOR).is(':visible')) {
                handleKeyPress(e);
            }
        });
        // Filter for search results
        $(document).on('keyup', Config.SEARCH_INPUT_SELECTOR, function (e) {
            var keyCode = e.keyCode, action = getActionFor(keyCode);
            switch (action) {
                case Actions.GOING_DOWN:
                case Actions.GOING_UP:
                case Actions.ESCAPING:
                case Actions.SWITCHING:
                    return;
                default:
                    var keyword = $(this).val();
                    if ($.trim(keyword) !== '') {
                        filterSearchResults(keyword);
                    }
                    else {
                        populateSearchResults(allSearchResults);
                    }
            }
        });
    }
    function appendUi($container) {
        $container.append(Templates.MAIN_TEMPLATE);
        return $container;
    }
    // Avoid Plugin.prototype conflicts
    $.extend(OmniSearch.prototype, {
        init: function () {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like the example below
            var $container = $(this.element);
            appendUi($container);
            bindUi();
        },
        open: function (searchResults, onActivateSearchItem) {
            console.log('>> Show omni search');
            $(Config.OMNI_SEARCH_SELECTOR).show();
            $(Config.SEARCH_INPUT_SELECTOR).focus();
            allSearchResults = searchResults;
            onActivateSearchItemCallback = onActivateSearchItem;
            populateSearchResults(searchResults);
        },
        close: closeOmniSearch
    });
    // You don't need to change something below:
    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations and allowing any
    // public function (ie. a function whose name doesn't start
    // with an underscore) to be called via the jQuery plugin,
    // e.g. $(element).defaultPluginName('functionName', arg1, arg2)
    $.fn[pluginName] = function (options) {
        var args = arguments;
        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                // Only allow the plugin to be instantiated once,
                // so we check that the element has no plugin instantiation yet
                if (!$.data(this, 'plugin_' + pluginName)) {
                    // if it has no instance, create a new one,
                    // pass options to our plugin constructor,
                    // and store the plugin instance
                    // in the elements jQuery data object.
                    $.data(this, 'plugin_' + pluginName, new OmniSearch(this, options));
                }
            });
        }
        else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            // Cache the method call
            // to make it possible
            // to return a value
            var returns;
            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof OmniSearch && typeof instance[options] === 'function') {
                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(this, 'plugin_' + pluginName, null);
                }
            });
            // If the earlier cached method
            // gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };
}());
//# sourceMappingURL=omni.search.js.map