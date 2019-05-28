/**
 * SDF Query
 * Simple utility for selecting and modifying DOM elements used by SDF CSS Framework.
 * Lightweight alternative to some escentials of jQuery compatible with modern browser and ie11+
 * @package SDF
 * @author  eugenioenko
 * @license http://opensource.org/licenses/MIT  MIT License
 * @tutorial https://eugenioenko.github.io/sdf-query/docs/index.html
 * @link    https://github.com/eugenioenko/sdf-css
 * @version 0.9.9
 */
(function(){
"use strict";

if(typeof window === "undefined" || typeof document === "undefined"){
    throw new Error("sdf-query requires a browser");
}

/**
 * Query Function
 *
 * This function enables you to select html elements from the DOM and return an object which
 * lets you modify their attributes, classes, values, styles and add event handlers.
 *
 * @param  {string|object} selector A string which is gonna be used to query elements or a Node element.
 * If selector starts with '#' getElementsById will be used limiting the result to 1.
 * @param {number|optional}        limit If set to a number, will limit the results of the query
 * to the amount. If set to one, element will be selected by using querySelector instead of querySelectorAll.
 *
 * @return {object} Which contains the methods for dom manipulation.
 *
 * @example
 * // adds an event handler for a button of id #button_id
 * s('#button_id').on('click', function(){});
 *
 * @example
 * // Iterates over all the ul of a page and appends an li and prepends li
 * s('ul').append('<li>appended</li>').prepend('<li>prepended</li>');
 *
 * @example
 *  // Custom iterator
 *  s('span').each(function(){
 *      s(this).attr('data-active', 'false');
 *  });
 *  // Chaining
 *  s('span[data-attr="value"]').prepend('<br>').append('!');
 *
 */
function SdfSelect(selector, limit, parent){
    parent = (typeof parent === "undefined" ) ? document : parent;
    limit = (typeof limit === "undefined") ? -1 : limit;
    var elements =  [];
    var element = {};
    var method = '';

    var isNodeListEmpty = function(nodeList){
        return nodeList.length == 0;
    };

    var parseAndQueryItemById = function(){
        method = 'getElementById';
        element = parent.getElementById(selector.substring(1));
        if(element){
            elements.push(element);
        }
    };

    var parseAndQuerySingleItem = function(){
        method = "querySelector";
        element = parent.querySelector(selector);
        if(element){
            elements.push(element);
        }
    };

    var parseAndQueryAll = function(){
        method = "querySelectorAll";
        var nodes = parent.querySelectorAll(selector);
        if(limit == -1){
            limit = nodes.length;
            elements = nodes;
            return;
        }
        limit = limit > nodes.length ? nodes.length : limit;
        for(var i = 0; i < limit; ++i){
            elements.push(nodes[i]);
        }
    };

    var parseStringSelector = function(){
        selector = selector.trim();
        if(selector.charAt(0) == '#'){
            parseAndQueryItemById();
        } else if(limit == 1){
            parseAndQuerySingleItem();
        } else {
            parseAndQueryAll();
        }
    };

    var parseNodeSelector = function(){
        method = "element";
        elements.push(selector);
        selector = false;
    };

    var parseErrorMessage = function(){
        method = "error";
        // selector is not a string nor a dom Node Object
        console.error(selector + " is not a string, 'query' requires a string as selector");
        selector = false;
    };
    var utils = {
        validateArgTypes: function(args, types){
            // the number of arguments passed should be the same as required ones
            if(args.length != (types.length)){
                return false;
            }
            for(var i = 0; i < args.length; ++i){
                 if(types[i] === "any"){
                    args[i] = (args[i]).toString();
                } else {
                    if(typeof args[i] !== types[i]){
                        return false;
                    }
                }
            }
            return true;
        },
        createClassList: function(classList){
            var classes = classList.split(' ');
            for (var i = 0; i < classes.length; ++i){
                classes[i] = classes[i].replace(' ', '');
            }
            return classes;
        }
    };

    if (arguments.length) {
        if (typeof selector === "string"){
           parseStringSelector();
        } else if(typeof selector === "object" && selector instanceof Node){
            parseNodeSelector();
        }else {
           parseErrorMessage();
        }
    } else {
        method = null;
        // null selector used for create
        selector = false;
    }
    if(isNodeListEmpty(elements) && method != null) {
        console.warn('sdf-query: No elements with selector "' + selector + '"');
        return new SdfDom(selector, null, 0, method);
    }
    return new SdfDom(selector, elements, elements.length, method, utils);
}

window.s =  SdfSelect;


function SdfDom(selector, nodes, length, method, utils){
    this.selector = selector;
    this.nodes = nodes;
    this.length = length;
    this.method = method;
    this.utils = utils;
}

/**
* Adds classnames to the elements in the node list
*
* @param  {string} classList List of classes separated by space or a signle classname
*
* @return {object} Query object for nesting
*
* @example
* // adds classes through custom iterator
* s('li').each(function(){
*   s(this).addClass('class-1 class-2 class-3');
* });
*
* @example
* // adds classes through method
* s('li').addClass('class-1 class-2 class-3')
*/
SdfDom.prototype.addClass = function(classList){
    if(!this.utils.validateArgTypes(arguments, ["string"])){
        throw new Error("'addClass' takes classList{string} as argument");
    }

    var classes = this.utils.createClassList(classList);
    for (var i = 0; i < this.nodes.length; ++i) {
        for(var j = 0; j < classes.length; ++j){
            if(classes[j] != ''){
                this.nodes[i].classList.add(classes[j]);
            }
        }
    }
    return this;
};
/**
* Inserts content after each element of the list.
* If content is a string parses the specified text as HTML
* and inserts the resulting nodes.
*
* @param  {string|node} value String or Node to be inserted
*
* @example
* cheat sheet
* <!-- before -->
* <element>
*   <!-- prepend -->
*   {{elements content}}
*   <!-- append -->
* </element>
* <!-- after -->
*
* @example
* // after a div in the div#first
* s('li#first').after('<li id="second"></li>');
*
* @return {object} Query object for nesting
*/
SdfDom.prototype.after = function(content){
    this.insert('afterend', content);
    return this;
};
/**
* Sets the attribute of each elements in the list or,
* Gets the value of attribute of the first element if no arguments
*
* @param {string} attr Attribute to be set
* @param  {string} value Optional, the new attribute value
*
* @return {mixed} Query object for nesting or value if getter
*
* @example
* // reads the attribute data-date from a clicked button
* s('button').click(function(){
*   var date = s(this).attr('data-date');
*   // to do
*   s(this).attr('data-date', date);
* });
*/
SdfDom.prototype.attr = function(attr, value){
    if(this.utils.validateArgTypes(arguments, ["string"])){
        return this.nodes[0].getAttribute(attr);
    } else if(this.utils.validateArgTypes(arguments, ["string", "any"])){
        for (var i = 0; i < this.nodes.length; ++i) {
            this.nodes[i].setAttribute(attr, value);
        }
    } else {
        console.error("'attr' requires attr{string} for getter and value{any} as setter");
    }
    return this;
};
/**
* Appends content to each element of the list.
* If content is a string parses the specified text as HTML
* and inserts the resulting nodes.
*
* @param  {string|node} value String or Node to be inserted
*
* @example
* cheat sheet
* <!-- before -->
* <element>
*   <!-- prepend -->
*   {{elements content}}
*   <!-- append -->
* </element>
* <!-- after -->
*
* @example
* // appends a div in the div#first
* s('div#first_element').append('<div></div>');
*
* @return {object} Query object for nesting
*/
SdfDom.prototype.append = function(content){
    this.insert('beforeend', content);
    return this;
};
/**
* Inserts content before each element of the list.
* If content is a string, 'prepend' parses the specified text as HTML
* and inserts the resulting nodes.
*
* @param  {string|node} value String or Node to be inserted
*
* @example
* cheat sheet
* <!-- before -->
* <element>
*   <!-- prepend -->
*   {{elements content}}
*   <!-- append -->
* </element>
* <!-- after -->
*
* @example
* // inserts a div before the div#first
* s('div#first').before('<div id="before_first"></div>');
*
* @return {object} Query object for nesting
*/
SdfDom.prototype.before = function(content){
    this.insert('beforebegin', content);
    return this;
};
/**
* Creates an html element to be later appended with append
*
* @param  {string} type The type of element: div,li, button, a...
* @param  {string} html Inner html of the element
*
* @return {object}      Node element of DOM
*
* @example
* // creates a node and appends it
* s('ul').append(s().create('li', 'list item A'));
*/
SdfDom.prototype.create = function(tag, html){
	if(typeof tag === "string"){
		var element = document.createElement(tag);
		if(typeof html !== "undefined"){
			element.innerHTML = html;
		}
		return element;
	} else {
		console.warn("'create' takes tag{string} and html{string|optional} as argument");
		return this;
	}

};
/**
* Sets the style of each elements in the list or,
* Gets the value of style of the first element if no arguments
*
* @param {string} attr Attribute to be set
* @param  {string} value Optional, the new style value
*
* @return {mixed} Query object for nesting or value if getter
*
* @example
* // reads the style data-date from a clicked button
* s('button').click(function(){
*   var opacity = s(this).css('opacity');
*   // to do
*   opacity -= 0.3;
*   s(this).css('opacity', opacity);
*   s(this).css({opacity: 1, color: 'red'});
* });
*/
SdfDom.prototype.css = function(style, value){
    var i = 0;
    if(this.utils.validateArgTypes(arguments, ["string"])){
        // getter
         return this.nodes[0].style[style];
    } else if(this.utils.validateArgTypes(arguments, ["object"])){
        value = style;
        // setter with object param
        for (i = 0; i < this.nodes.length; ++i) {
            for(var key in value){
                if(!value.hasOwnProperty(key)) continue;
                this.nodes[i].style[key] = value[key];
            }
        }
        return this;
    } else if(this.utils.validateArgTypes(arguments, ["string", "any"])){
        for (i = 0; i < this.nodes.length; ++i) {
            this.nodes[i].style[style] = value;
        }
    } else {
        throw new Error("'css' takes style{string} and value{string|object} as arguments");
    }

    return this;
};
/**
* Iterates over every item from the selected element list.
* Sets "this" to the currently iterated element.
*
* @param  {function} method A function to execute for each node
* @this Currently iterated element
*
* @return {object} Query object for nesting
*
* @example
* // Iterates over buttons with class active, gets the attribute data-state,
* does something and finally sets data-state to false
* s('button.active').each(function(){
*   var state = s(this).attr('data-state');
*   // to do
*   s(this).attr('data-state', 'false');
* });
*/
SdfDom.prototype.each = function(method){
    if(this.utils.validateArgTypes(arguments, ["function"])){
        for (var i = 0; i < this.nodes.length; ++i) {
            method.call(this.nodes[i]);
        }
    } else {
        throw new Error(method + " is not a function, 'each' requires a function as argument");
    }
    return this;
};
/**
* Gets the first element in the selected list of nodes
*
* @return {object} First element in the list
*
* @example
* var element = s('div.class-name').element();
* element.style.display = 'block';
* s(element).css({display: 'block', opacity: '0.5'});
*/

SdfDom.prototype.element = function(){
    return this.nodes[0];
};

/**
* Returns the first element in the list
* Alias to element()
* @return {object} Element
*/
SdfDom.prototype.first = function(){
    return this.element();
};
/**
* Returns a list of decendent elements from the selected element.
* @param  {string} selector
*
* @return Query object for nesting and dom modification
*
*/
SdfDom.prototype.find = function(selector){
    if(!this.utils.validateArgTypes(arguments, ["string"])){
        console.error("'find' takes selector{string} as argument");
        return this;
    }
    return s(selector, -1, this.nodes[0]);
};
/**
* Returns true if a class is present in the first element class list
*
* @param  {string} className Name of the class without "."
*
* @return {bool} If the classname is present in the list
*
* @example
* if(s('#element').hasClass('class-name')){
*     // to do
* }
*
* @example
* // checks if element is active on click, does stuff, removes class active.
* s('#element_id').on('click', function(){
*     if(s(this).hasClass('active')){
*         // to do
*         s(this).removeClass('active');
*     }
* });
*/
SdfDom.prototype.hasClass = function(className){
    if(!this.utils.validateArgTypes(arguments, ["string"])){
        throw new Error("'hasClass' takes className{string} as argument");
    }
    className = className.trim();
    return this.nodes[0].classList.contains(className);
};
/**
* Hides an element.
* (Sets display property to none)
*
* @return {object} Query object for nesting
*
* @example
* // hides the element
* s('selector').hide();
*/
SdfDom.prototype.hide = function(){
    for (var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i].style.display = "none";
    }
    return this;
};
/**
* Sets the innerHTML of each element in the list or,
* Gets the innerHTML of the first element on the list
*
* @param  {string} value Optional, the new innerHTML value
*
* @return {object|string} Query object for nesting or value if getter
*
* @example
* // sets inner conent of body
* s('body').html('<h1>Hello, World!</h1>');
* // gets the html of the body
* var body = s('body').html();
*/
SdfDom.prototype.html = function(value){
	if(arguments.length == 0){
	    return this.nodes[0].innerHTML;
	}
    if(!this.utils.validateArgTypes(arguments, ["any"])){
        throw new Error("'html' takes value {any} as argument or no arguments.");
    }
    for (var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i].innerHTML = value;
    }
    return this;
};
/**
* Inserts content to each element of the list.
* If content is a string, parses the specified text as HTML
* and inserts the resulting nodes.
*
* @param  {string} position  Location relative to the element where to be inserted
* @param  {string|node} value String or Node to be inserted
*
* @example
* cheat sheet
* <!-- beforebegin -->
* <element>
*   <!-- afterbegin -->
*   {{elements content}}
*   <!-- beforeend -->
* </element>
* <!-- afterend -->
*
* @example
* // inserts a div before the div#first
* s('div#first').insert('<div id="before_first"></div>', 'beforebegin');
*
* @return {object} Query object for nesting
*/
SdfDom.prototype.insert = function(position, content){
    var insertMethod = "";
    if(this.utils.validateArgTypes(arguments, ["string", "string"])){
        insertMethod = "insertAdjacentHTML";
    }
    if(this.utils.validateArgTypes(arguments, ["string", "object"]) &&
        content instanceof Node ){
        insertMethod = "insertAdjacentElement";
    }
    if(!insertMethod.length){
        throw new Error("'insert' takes position{string} and content{string|Node} as argument");
    }
    for(var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i][insertMethod](position, content);
    }
    return this;
};
/**
* Adds event listener to the selected elements.
* Sets "this" to the currently iterated element.
*
* @param  {string}   event  Type of the event to listen to
* @param  {function} method Method to execute on the event
* @this points to the currently iterated element
*
* @return {object} Query object for nesting
*
* @example
* s('selector').on('click', function(){
*     //to do
* });
* s('input[type="text"]').on('change', function(){
*     var value = s(this).value();
*     alert(value);
* });
*/
SdfDom.prototype.on = function(event, method){
    if(this.utils.validateArgTypes(arguments, ["string", "function"])){
        // adding event listeners
        for (var i = 0; i < this.nodes.length; ++i) {
            this.nodes[i].addEventListener(event, method);
        }
    } else {
        throw new Error("'on' requires event {string} and method {function}");
    }
    return this;
};
/**
* Prepends content to each element of the list.
* If content is a string parses the specified text as HTML
* and inserts the resulting nodes.
*
* @param  {string|node} value String or Node to be inserted
*
* @example
* cheat sheet
* <!-- before -->
* <element>
*   <!-- prepend -->
*   {{elements content}}
*   <!-- append -->
* </element>
* <!-- after -->
*
* @example
* // prepends a div in the div#first
* s('div#first').prepend('<div id="start_of_first"></div>');
*
* @return {object} Query object for nesting
*/
SdfDom.prototype.prepend = function(content){
    this.insert('afterbegin', content);
    return this;
};
/**
* Removes each selected element from the page
*
* @return {object} Query object for nesting
*
* @example
* // destroys the body
* s('body').remove();
*/
SdfDom.prototype.remove = function(){
    for (var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i].parentNode.removeChild(this.nodes[i]);
    }
    this.nodes = [];
    this.selector = null;
    this.length = 0;
    return this;
};
/**
* Removes an attribute from each element in the list
*
* @param  {string} attr Name of the attribute to be removed from the element
*
* @return {object} Query object for nesting
*
* @example
* // removes the attribute 'data-active' from all the div with data-active="false"
* s('div[data-active="false"]').removeAttr('data-active');
*/
SdfDom.prototype.removeAttr = function(attrName){
    if(!this.utils.validateArgTypes(arguments, ["any"])){
        console.error("'append' takes string{any} as argument");
        return this;
    }
    for (var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i].removeAttribute(attrName);
    }
    return this;
};
/**
* Removes classes from  elements in the list
*
* @param  {string} classList List of classes separated by space
*
* @return {object} Query object for nesting
*
* @example
*  // removes the classes ".class-1, .class-2" from the first 10 elements with class .class-0
*  s('.class-0').removeclass('class-1 class-2');
*/
SdfDom.prototype.removeClass = function(classList){
    if(!this.utils.validateArgTypes(arguments, ["string"])){
        console.error("'removeClass' takes classList{string} as argument");
        return this;
    }
    var classes = this.utils.createClassList(classList);
    for (var i = 0; i < this.nodes.length; ++i) {
        for(var j = 0; j < classes.length; ++j){
            if(classes[j] != ''){
                this.nodes[i].classList.remove(classes[j]);
            }
        }
    }
    return this;
};
/**
* Shows an element on the screen.
* (Restores original display property value)
*
* @return {object} Query object for nesting
*
* @example
* // shows the element
* s('selector').show();
*/
SdfDom.prototype.show = function(){
    for (var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i].style.removeProperty("display");
    }
    return this;
};
/**
 * Sets the textContent of each elements in the list or
 * Gets the value of textContent of the first element if no arguments
 *
 * @param  {string} value Optional, the new textContent value
 *
 * @return {mixed} Query object for nesting or value if getter
 *
 * @example
 * // gets the textContent of the element with id #element
 * var text = s('#element').text();
 * // sets the textContent of all the first 3 li of ul#list
 * s('ul#list>li', 3).text('Hello, World!');
 */
SdfDom.prototype.text = function(value){
    if(arguments.length == 0){
        return this.nodes[0].textContent;
    }
    if(!this.utils.validateArgTypes(arguments, ["any"])){
        throw new Error("'text' takes value {any} as argument or no arguments.");
    }
    for (var i = 0; i < this.nodes.length; ++i) {
        this.nodes[i].textContent = value;
    }
    return this;
};
/**
* Sets the value of each elements in the list or
* Gets the value of the first element if no arguments
*
* @param  {string} val Optional, the new value value
*
* @return {object} Query object for nesting
*
* @example
* // gets the value of the input with id #input_1
* var val = s('input#input_1').value();
*/
SdfDom.prototype.value = function(val){
    if(arguments.length == 0){
        return this.nodes[0].value;
    }
    if(this.utils.validateArgTypes(arguments, ["any"])){
        for (var i = 0; i < this.nodes.length; ++i) {
            this.nodes[i].value = val;
        }
    } else {
        console.error("'value' takes value {string} as argument or no arguments.");
    }
    return this;
};
})();
 /**
 * @license
 * This content is released under the MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */