/*
 *  omni-search - v1.0.0
 *  A UI element for global searches
 *
 *
 *  Made by Pedro Catré
 *  Under MIT License
 */
(function () {
    'use strict';
    console.log('1');
    /**
     * Configuration constants for the extension
     *
     * @type {Object}
     */
    var Templates;
    (function (Templates) {
        Templates[Templates["MAIN_TEMPLATE"] = "<div class=\"omni-search\" style=\"display: none;\">\n\t\t\t\t\t<input type=\"text\">\n\t\t\t\t\t<ul class=\"lists-list\">\n\t\t\t\t\t</ul>\n\t\t\t\t</div>"] = "MAIN_TEMPLATE";
        Templates[Templates["LIST_TEMPLATE"] = "<li class=\"list-item\">\n\t\t\t\t\t<span class=\"favicon-img\">\n\t\t\t\t\t<img src=\"{favicon}\" onerror=\"this.src='{default_favicon}';\">\n\t\t\t\t\t</span>\n\t\t\t\t\t<span class=\"title\">{title}</span>\n\t\t\t\t</li>"] = "LIST_TEMPLATE";
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
        SELECTED_CLASS: 'selected-list',
        SELECTED_SEARCH_RESULT_SELECTOR: '.selected-list',
        FAVICON_IMG_SELECTOR: '.favicon-img img',
        OMNI_SEARCH_SELECTOR: '.omni-search',
        SEARCH_RESULTS_LIST_SELECTOR: '.omni-search .lists-list',
        SEARCH_RESULT_SELECTOR: '.list-item',
        SEARCH_INPUT_SELECTOR: '.omni-search input[type="text"]',
        // References to wunderlist DOM elements
        LIST_LINKS: '.sidebarItem a',
        SELECTED_TASK: '.taskItem.selected',
        // Shortcut for activation
        MASTER_KEY: '⌘+⇧+l'
    };
    /**
     * Houses all the lists, once fetched
     *
     * @type array
     */
    var allLists = [];
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
     * Moves the focus for the selected list for the passed action
     *
     * @param action
     */
    function moveListFocus(action) {
        var $firstSelected = $(Config.SELECTED_SEARCH_RESULT_SELECTOR);
        // If some list was already selected
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
    function populateLists(lists) {
        var $lists = getListsHtml(lists);
        $(Config.SEARCH_RESULTS_LIST_SELECTOR).html($lists);
        $(Config.SEARCH_RESULT_SELECTOR).first().addClass(Config.SELECTED_CLASS);
    }
    /**
     * Generates HTML string for the passed array of objects
     *
     * @param lists
     * @returns {string}
     */
    function getListsHtml(lists) {
        var $listsHtml = $('<span></span>');
        lists.forEach(function (list) {
            var tempListTemplate = Templates.LIST_TEMPLATE, faviconUrl = list.favIconUrl || Config.DEFAULT_FAVICON;
            tempListTemplate = tempListTemplate.replace('{favicon}', faviconUrl);
            tempListTemplate = tempListTemplate.replace('{default_favicon}', Config.DEFAULT_FAVICON);
            tempListTemplate = tempListTemplate.replace('{title}', list.title);
            // tempListTemplate = tempListTemplate.replace('{listPath}', list.href);
            //tempListTemplate = tempListTemplate.replace('{dataItem}', JSON.stringify(list.data));
            var $listTemplate = $(tempListTemplate);
            $listTemplate = $listTemplate.data(list);
            $listsHtml.append($listTemplate);
        });
        return $listsHtml;
    }
    /**
     * Filters lists by the specified keyword string
     *
     * @param keyword
     */
    function filterLists(keyword) {
        keyword = keyword.toLowerCase();
        var matches = [], tempTitle = '', tempUrl = '';
        allLists.map(function (list) {
            tempTitle = list.title.toLowerCase();
            tempUrl = list.href.toLowerCase();
            if (tempTitle.match(keyword) || tempUrl.match(keyword)) {
                matches.push(list);
            }
        });
        populateLists(matches);
    }
    /**
     * Gets the action to be performed for the given keycode
     *
     * @param keyCode
     * @returns {*}
     */
    function getSwitcherAction(keyCode) {
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
     * Switches to the currently focused list
     */
    function callSelectedItemAction() {
        var $firstSelected = $(Config.OMNI_SEARCH_SELECTOR).find(Config.SELECTED_SEARCH_RESULT_SELECTOR).first();
        // TODO put item as constant
        callItemAction($firstSelected);
        //
        //var listPath = $firstSelected.data('listPath');
        //switchToList(listPath);
    }
    /**
     * Performs the action for the passed keypress event
     *
     * @param event
     */
    function handleKeyPress(event) {
        var action = getSwitcherAction(event.keyCode);
        switch (action) {
            case Actions.GOING_UP:
            case Actions.GOING_DOWN:
                moveListFocus(action);
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
        // mouse-down instead of click because click gets triggered after the blur event in which case wunderlist navigator
        // would already be hidden (@see blur event below) and click will not be performed
        $(document).on('mousedown', Config.SEARCH_RESULT_SELECTOR, function () {
            var $this = $(this);
            callItemAction($this);
            //switchToList(listPath);
        });
        // Hide the switcher on blurring of input
        $(document).on('blur', Config.SEARCH_INPUT_SELECTOR, function () {
            closeOmniSearch();
        });
        // Actions on tabs listing
        $(document).on('keydown', Config.SEARCH_INPUT_SELECTOR, function (e) {
            // Switcher was visible and either down or up key was pressed
            if ($(Config.OMNI_SEARCH_SELECTOR).is(':visible')) {
                handleKeyPress(e);
            }
        });
        // Filter for lists
        $(document).on('keyup', Config.SEARCH_INPUT_SELECTOR, function (e) {
            var keyCode = e.keyCode, action = getSwitcherAction(keyCode);
            switch (action) {
                case Actions.GOING_DOWN:
                case Actions.GOING_UP:
                case Actions.ESCAPING:
                case Actions.SWITCHING:
                    return;
                default:
                    var keyword = $(this).val();
                    if ($.trim(keyword) !== '') {
                        filterLists(keyword);
                    }
                    else {
                        populateLists(allLists);
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
        open: function (lists, onActivateSearchItem) {
            console.log('>> Show omni search');
            $(Config.OMNI_SEARCH_SELECTOR).show();
            $(Config.SEARCH_INPUT_SELECTOR).focus();
            allLists = lists;
            onActivateSearchItemCallback = onActivateSearchItem;
            populateLists(lists);
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
