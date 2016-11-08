var DEMO_URL = 'http://localhost:9006/demo/index.html', OPEN_OMNI_SEARCH_BTN = 'button.open-search', OMNI_SEARCH_SELECTOR = '.omni-search', OMNI_SEARCH_LIST_ELEMENTS_SELECTOR = '.search-result', OMNI_SEARCH_INPUT_SELECTOR = '.omni-search input', TOTAL_NUMBER_OF_SEARCH_ELEMENTS = 3, SELECTED_ITEM_SELECTOR = '.selected-search-result';
function givenDemoPageIsOpen(browser) {
    browser
        .url(DEMO_URL)
        .waitForElementVisible('body', 1000).pause(1000);
    browser.assert.hidden(OMNI_SEARCH_SELECTOR);
}
function whenButtonToOpenOmniSearchIsClicked(browser) {
    browser.click(OPEN_OMNI_SEARCH_BTN);
}
function thenOmniSearchIsOpen(browser) {
    browser.assert.visible(OMNI_SEARCH_SELECTOR);
}
function thenNumberOfSearchResultsIs(browser, numberOfExpectedResults) {
    browser.elements('css selector', OMNI_SEARCH_LIST_ELEMENTS_SELECTOR, function (result) {
        browser.assert.equal(result.value.length, numberOfExpectedResults);
    });
}
function givenSearchText(browser, searchText) {
    browser.clearValue(OMNI_SEARCH_INPUT_SELECTOR).setValue(OMNI_SEARCH_INPUT_SELECTOR, searchText).pause(1000);
}
function givenSearchWithResult(browser) {
    givenSearchText(browser, 'important');
    thenNumberOfSearchResultsIs(browser, 1);
}
function whenClickSelectedItem(browser) {
    browser.click(SELECTED_ITEM_SELECTOR).pause(1000);
}
function thenMsgPlaceholderContainsText(browser, expectedPlaceholderMsg) {
    browser.assert.containsText('.msg-placeholder', expectedPlaceholderMsg);
}
function givenWentToSecondSearchResultUsingArrowKeys(browser) {
    browser.keys(browser.Keys.DOWN_ARROW);
    browser.keys(browser.Keys.DOWN_ARROW);
    browser.keys(browser.Keys.UP_ARROW);
}
function whenClickEnter(browser) {
    browser.keys(browser.Keys.ENTER);
}
module.exports = {
    beforeEach: function (browser) {
        givenDemoPageIsOpen(browser);
        whenButtonToOpenOmniSearchIsClicked(browser);
    },
    //afterEach : function(browser) {
    //	browser.end();
    //},
    'should open omni-search and list all search elements': function (browser) {
        thenOmniSearchIsOpen(browser);
        thenNumberOfSearchResultsIs(browser, TOTAL_NUMBER_OF_SEARCH_ELEMENTS);
        browser.end();
    },
    'should search by the 1st word': function (browser) {
        givenSearchText(browser, 'important');
        thenNumberOfSearchResultsIs(browser, 1);
        browser.end();
    },
    'should search by non existing text': function (browser) {
        givenSearchText(browser, 'searching for this will return nothing');
        thenNumberOfSearchResultsIs(browser, 0);
        browser.end();
    },
    'should search by nothing': function (browser) {
        givenSearchWithResult(browser);
        givenSearchText(browser, ' ');
        thenNumberOfSearchResultsIs(browser, TOTAL_NUMBER_OF_SEARCH_ELEMENTS);
        browser.end();
    },
    'should search by second word of the title': function (browser) {
        givenSearchText(browser, 'google');
        thenNumberOfSearchResultsIs(browser, 1);
        browser.end();
    },
};
