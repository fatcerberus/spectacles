/*
LinkedList
Version: 1.0
Author: Metallix

Usage:

var list = new utils.LinkedList(); // Creates a new list

var item5 = list.push( 5 ); // Push a value to the end of the list. Returns a list item reference.
var item4 = list.unshift( 4 ); // Push a value to the front of the list. Returns a list item reference.

list.pop(); // Removes the last value from the list and returns it. ( 5 );
list.shift(); // Removes the first value from the list and returns it. ( 4 );

list.remove( item5 ); // Removes a item from the list. NOTE: You have to provide the item returned by push().

list.getFirstValue(); // Returns the value of the first list item;
list.getLastValue(); // Returns the value of the last list item;

function callback( value ) {
// ...
}
list.forEachValue( callback );
// Iterates over the list starting with the first item
// and calls the provided function with the value of the current list item as first argument.
*/
var utils = utils || {};

utils.LinkedList = function() {
    var _first = null;
    var _last = null;

    this.push = function( value ) {
        var item = {
            value : value    
        }
        if ( _last ) {
            _last.next = item;
            item.prev = _last;
            _last = item;
        }
        else {
            _first = _last = item;
        }
        
        return item;
    }
    
    this.pop = function() {
        var value = null;
        if ( _last ) {
            value = _last.value;
            if ( _last.prev ) {
                _last = _last.prev;
                _last.next = null;
            }
            else {
                _last = null;
                _first = null;
            }
        }
        return value;
    }
    
    this.shift = function() {
        var value = null;
        if ( _first ) {
            value = _first.value;
            if ( _first.next ) {
                _first = _first.next;
                _first.prev = null;
            }
            else {
                _last = null;
                _first = null;
            }
        }
        return value;
    }    

    this.unshift = function( value ) {
        var item = {
            value : value
        }
        if ( _first ) {
            _first.prev = item;
            item.next = _first;
            _first = item;
        }
        else {
            _first = _last = item;
        }
        return item;
    }
    
    this.remove = function( item ) {
        var current = _first;
        while( current ) {
            if ( current == item ) {
                if ( current.prev ) current.prev.next = current.next;
                else _first = current.next;
                if ( current.next ) current.next.prev = current.prev;
                else _last = current.prev;
                return true;
            }
            current = current.next;
        }
        return false;
    }
    
    this.getFirstValue = function() {
        return _first ? _first.value : null;
    }
    
    this.getLastValue = function() {
        return _last ? _last.value : null;
    }
    
    this.forEachValue = function( callback, args ) {
        var item = _first;
        while( item ) {
            callback( item.value, args );
            item = item.next;
        }
    }
}