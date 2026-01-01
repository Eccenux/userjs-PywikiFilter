// ==UserScript==
// @name         PywikiFilter
// @namespace    pl.enux.wiki
// @version      2026-01-01
// @description  try to take over the world!
// @author       Nux
// @match        https://doc.wikimedia.org/pywikibot/stable/api_ref/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wikimedia.org
// @grant        none
// ==/UserScript==

/*
    Main source: https://github.dev/Eccenux/userjs-PywikiFilter
    ViewFilter from: https://gist.github.com/Eccenux/5a72d124f2379d36760c195b07002a6b/
*/

{
	let el = document.querySelector('.toc-drawer .toc-sticky');
	if (!el) {
		return;
	}
	// HTML
	el.insertAdjacentHTML('afterbegin', `
	 <div id="toc-filter-conatiner">
	  <div class="notes">
	   <p>(you can use RegExp)
	  </div>
	</div>
	`)
	// CSS
	document.body.insertAdjacentHTML('afterbegin', `
	 <style>
	 #toc-filter-conatiner {
	   font-size: .7rem;
	   padding: 1em .5em 0;
	   .notes {
	     padding-bottom: .5em;
	     p {
	      margin: 0;
		  padding: 0;
		 }
	   }
	 }
	 li.vf-unmatched {
	  display: none;
	  &:has(.vf-matched) {
	    display: list-item;
	  }
	 }
	 li.vf-matched li.vf-unmatched {
	  display: list-item;
	 }
	 li.vf-matched > a > code {
	  background: var(--color-highlight-on-target) !important;
	 }
	 </style>
	`)

	// --- deps
	const ReArray = ReArray_lgmjn345otgj0oi5rte4();
	const ViewFilter = ViewFilter_gflkdkgldkdflgk(ReArray);
	
	// --- setup
	let listFilter = new ViewFilter();
	listFilter.allowRegExp = true;
	listFilter.prepareRegExpField = ()=>{};
	listFilter.itemToText = function(item) {
		return item.querySelector('a,code').textContent.trim();
	};
	// replace filter to use classes for matches and only support RegExp search
	listFilter.filter = function(phrase) {
		//console.log (`filter`, phrase);
		var re;
		try {
			re = new RegExp(phrase, 'i');
		} catch (e) {
			this.invalidPhraseInfo(e.message);
			return false;
		}
		this.invalidPhraseClear();
		let matchCount = 0;
		for (let item of this.items) {
			if (re.test(item[this.itemProperty])) {
				item.style.display = '';
				item.classList.remove('vf-unmatched');
				item.classList.add('vf-matched');
				matchCount++;
			} else {
				item.classList.add('vf-unmatched');
				item.classList.remove('vf-matched');
			}
		}
		this.counterElement.textContent = ` (${matchCount})`;
		
		return true;
	}
	
	// --- init
	listFilter.init("#toc-filter-conatiner", ".toc-tree > ul > li li");
	//listFilter.filterContainer.querySelector('input[type=text]').value = 'pag';
}

/**
 * Helper class for testing match of an array of strings.
 *
 * @param {Array} strings Array of strings to be prepared and used in search.
 * @param {String} regExpFlags Flags passed to RegExp (g/i/m).
 */
function ReArray_lgmjn345otgj0oi5rte4() {
class ReArray {
	constructor(strings, regExpFlags, exactMatch) {
		this._reArray = [];

		var strToRegExp;
		if (!exactMatch) {
			strToRegExp = (str) => this.escapeStr4RegExp(str);
		} else {
			strToRegExp = (str) => '^'+this.escapeStr4RegExp(str)+'$';
		}

		for (var i = 0; i < strings.length; i++) {
			this._reArray.push(new RegExp(strToRegExp(strings[i]), regExpFlags));
		}
	}
	/**
	 * Escape phrase pre-creating RegExp.
	 *
	 * @param {String} str
	 * @returns {String}
	 */
	escapeStr4RegExp(str) {
		return str.replace(/([\[\]\{\}\|\.\*\?\(\)\$\^\\])/g, '\\$1');
	}
	/**
	 * Test RegExp array for the given string.
	 *
	 * @param {String} str String to match aginst array of RegExp.
	 * @param {Boolean} matchAny (default=false) If true then match any the RegExp, otherwise all must match.
	 * @returns {Boolean}
	 */
	test(str, matchAny) {
		var numMatches = 0;
		for (var i = 0; i < this._reArray.length; i++) {
			var re = this._reArray[i];
			if (re.test(str)) {
				if (matchAny) {
					return true;
				} else {
					numMatches++;
				}
			}
		}
		return (numMatches == this._reArray.length);
	}
}
	return ReArray;
}

/**
 * Adds a simple filter input for any views (widgets).
 *
 * @author Maciej "Nux" Jaros
 *
 * Basic usage example:
 * <pre>
	// define view filter (do this at any time)
	var listFilter = new ViewFilter();
	// on load create controls and pre-parse items
	$(function(){listFilter.init("#filter-controls-container", "#list-container li")});
 * </pre>
 *
 * By default text contents of whol items are matched.
 * You might wan to re-define `itemToText` to e.g. only use text from header:
 * <pre>
	// this will be a filter for sections (e.g. stats)
	var sectionFilter = new ViewFilter();
	// we just filter by header of section (e.g. stat name)
	sectionFilter.itemToText = function(item) {
		return item.querySelector('h2').textContent;
	};
	// on load create controls and pre-parse items
	$(function(){sectionFilter.init("#controls", "section")});
 * </pre>
 *
 * Note! For dynamic items you must call `.preParseItems()` after changing items
 *
 * Licensed under (at ones choosing)
 * <li>MIT License: http://www.opensource.org/licenses/mit-license
 * <li>or CC-BY: http://creativecommons.org/licenses/by/3.0/
 *
 * @returns {ViewFilter}
 */
// eslint-disable-next-line no-unused-vars
function ViewFilter_gflkdkgldkdflgk(ReArray) {
	
class ViewFilter {
	/**
	 * Note! Parameters are used for backward compatibility.
	 * @see #init();
	 */
	constructor(controlsSelector, itemsSelector) {
		/**
		 * Items data (elements).
		 * @private
		 */
		this.items = [];
		/**
		 * I18n (labels)
		 */
		this.i18n = {
			search: 'Search',
		}

		/**
		 * Item property name to store search text.
		 * Note! This must be unique for a specific filter and must not clash with other modules.
		 */
		this.itemProperty = 'ViewFilter_text';

		/**
		 * Allow regular expression in search.
		 */
		this.allowRegExp = false;

		this.inputPhrase = null;

		/**
		 * Minimum items count that makes filtering feasible.
		 * If there are less items then filtering will not be active.
		 */
		this.minItems = 2;

		this.controlsSelector = controlsSelector;
		this.itemsSelector = itemsSelector;
	}
	/**
	 * Parse item to text used for filtering.
	 * 
	 * @param {Element} item The item element.
	 * @returns {String}
	 */
	itemToText (item) {
		return item.textContent.trim();
	}

	/**
	 * Initalize after doc.ready.
	 * 
	 * Note! Item data is read statically into item properties.
	 * The data will not change if item text is changed with JS.
	 * Re-run `preParseItems` if items change.
	 * @param {String} controlsSelector Selector for a container to contain controls.
	 * (filter input and RegExp checkbox).
	 * @param {String} itemsSelector Selector for items.
	 */
	init(controlsSelector, itemsSelector) {
		this.controlsSelector = controlsSelector;
		this.itemsSelector = itemsSelector;

		if (this.preParseItems()) {
			this.initControls();
		}
	}

	/**
	 * Pre-parse items
	 * @returns {Boolean} false if there are not enough items
	 */
	preParseItems () {
		// init items
		this.items = document.querySelectorAll(this.itemsSelector);
		if (this.items.length < this.minItems) {
			return false;
		}
		// setup filtering text and additional text
		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			item[this.itemProperty] = this.itemToText(item);
		}
		return true;
	}

	/**
	 * Creates an ID for inner elements.
	 *
	 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	 *
	 * @param {String} innerId
	 * @returns {String}
	 */
	generateGuid (innerId) {
		return innerId + '-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	/**
	 * Init controls.
	 * @returns {Boolean} false if container was not found
	 */
	initControls () {
		// existing, parent container for controls
		let parent = document.querySelector(this.controlsSelector);
		if (!parent) {
			return false;
		}

		this.addCss();

		// container for all filter controls
		const className = 'view-filter-controls';
		let allContainer = parent.querySelector('.' + className);
		if (!allContainer) {
			allContainer = document.createElement('div');
			allContainer.className = className;
			parent.appendChild(allContainer);
		}
		// this filter container
		let container = document.createElement('div');
		allContainer.appendChild(container);
		this.filterContainer = container;

		// prepare elements
		this.prepareSearchField(container);
		this.prepareCounter(container);
		this.prepareRegExpField(container);
		return true;
	}

	/**
	 * Prepare main field.
	 * @private
	 * @param {Element} container The field container.
	 */
	prepareSearchField(container) {
		var _self = this;
		var inputPhrase = document.createElement("input");
		inputPhrase.setAttribute("type", "text");
		inputPhrase.setAttribute("placeholder", this.i18n.search);
		inputPhrase.setAttribute("title", this.i18n.search);
		inputPhrase.addEventListener('keyup', function() {
			_self.filter(this.value);
		});
		container.appendChild(inputPhrase);
		this.inputPhrase = inputPhrase;
	}

	/**
	 * Prepare regexp field.
	 * @private
	 * @param {Element} container The field container.
	 */
	prepareRegExpField(container) {
		var _self = this;
		// prepare RegExp switch
		var idRegExp = this.generateGuid("RegExp");
		var label = document.createElement("label");
		label.setAttribute("for", idRegExp);
		var inputRegExp = document.createElement("input");
		inputRegExp.setAttribute("type", "checkbox");
		inputRegExp.id = idRegExp;
		inputRegExp.addEventListener('click', function() {
			_self.allowRegExp = this.checked;
			_self.filter(_self.inputPhrase.value);
		});
		label.appendChild(document.createTextNode('RegExp'));
		container.appendChild(inputRegExp);
		container.appendChild(label);
	}

	/**
	 * Prepare counter.
	 * @private
	 * @param {Element} container The field container.
	 */
	prepareCounter(container) {
		var span = document.createElement("span");
		this.counterElement = span;
		container.appendChild(span);
	}

	/**
	 * Set information about phrase field validity.
	 */
	invalidPhraseInfo (info) {
		this.inputPhrase.setCustomValidity(info);
	}
	/**
	 * Clear phrase field validity (set valid).
	 */
	invalidPhraseClear () {
		this.inputPhrase.setCustomValidity("");
	}

	/**
	 * Filter views matching all given words.
	 * 
	 * Words are matched in any order.
	 * so "abc def" will match "abc test def"
	 * and will also match "def test abc"
	 * but will not match "def test ab" (because abc is missing)
	 * 
	 * @private
	 * @param {String} phrase Filter string.
	 */
	filter (phrase) {
		//console.log (`filter`, phrase);
		var re;
		if (!this.allowRegExp) {
			// words to array
			var words = phrase
				.replace(/^\s+/, '')
				.replace(/\s+$/, '')
				.replace(/\s+/g, ' ')
				.split(' ')
			;

			re = new ReArray(words, 'i');
		} else {
			try {
				re = new RegExp(phrase, 'i');
			} catch (e) {
				this.invalidPhraseInfo(e.message);
				return false;
			}
		}
		this.invalidPhraseClear();
		var matchCount = 0;
		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			if (re.test(item[this.itemProperty])) {
				item.style.display = '';
				matchCount++;
			} else {
				item.style.display = 'none';
			}
		}
		this.counterElement.textContent = ` (${matchCount})`;
		return true;
	}

	/** CSS. */
	getCss() {
		return `
			.view-filter-controls {
				display: flex;
				gap: 1em;
			}
		`;
	}

	/** Add CSS. */
	addCss() {
		const id = 'viewfilter-style-a40934580jldhfj084957lhgldf';
		if (document.getElementById(id)) {
			return;
		}
		let style = document.createElement('style');
		style.id = id;
		style.innerHTML = this.getCss();
		document.head.appendChild(style);
	}	
}
	return ViewFilter;

}