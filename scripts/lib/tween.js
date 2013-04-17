/*
A simple tween helper inspired by Greensocks TweenLite but without any of the browser features and of course less powerful.
It is made to use it in plain JavaScript envionments.
This was made to use it in Sphere ( http://www.spheredev.org )

Usage:

In order to get the tweens working you have to call tween.update( ms )
somewhere in your main loop and provide the amount of milliseconds passed since the last frame.

If you do so, you can call tween.to() and tween.from() from everywhere in your code with the following args:

object:
    The object that contains the properties to tween. You can provide any javascript object.

duration:
    Duration in milliseconds the tween will last.

properties:
    A dictionary like object containing the properties of the object that has to be tweened.
    ie: { x : 0, y : 100 } to tween object.x to 0 and object.y to 100.

options:
    Tweening options. Currently supports following options...
    ease:
        Provide a ease function from the tween.ease object. Like tween.ease.circOut.
    onComplete:
        A function that is called when the tween has finished.
    onCompleteParams:
        An array of arguments that are passed to the onComplete function.
    delay:
        A delay in milliseconds before the tween starts.

Easing functions copied from: http://www.gizma.com/easing/
*/

RequireScript( "lib/linkedlist.js" );

var tween = tween || {};

( function(){

    var _activeInstances = new utils.LinkedList();

    tween.to = function ( object, duration, properties, options ) {
        var tween = new Tween( object, duration, properties, options );
        tween.start();
        return tween;
    }

    tween.from = function ( object, duration, properties, options ) {
        var tweenProperties = {};
        for ( var propertyName in properties ) {
            tweenProperties[propertyName] = object[propertyName];
            object[propertyName] = properties[propertyName];
        }
        var tween = new Tween( object, duration, tweenProperties, options );
        tween.start();
        return tween;
    }

    tween.update = function ( ms ) {
        _activeInstances.forEachValue( updateTween, { ms: ms } );
    }

    function updateTween( tween, args ) {
        tween.update( args.ms );
    }

    function Tween( object, duration, properties, options ) {
        this.time = ( options && options.delay ) ? -options.delay : 0;
        this.object = object;
        this.duration = duration;
        this.options = options;
        this.before = {};
        for ( var propertyName in properties ) {
            this.before[propertyName] = object[propertyName];
        }
        this.change = {};
        for ( var propertyName in properties ) {
            this.change[propertyName] = properties[propertyName] - object[ propertyName];
        }
        this.properties = properties;
        this.ease = ( options && options.ease ) ? options.ease : tween.ease.quadOut;
    }

    Tween.prototype.start = function () {
        this.listItem = _activeInstances.push( this );
    }

    Tween.prototype.update = function ( ms ) {
        this.time += ms;
        if ( this.time > 0 ) {
            if ( this.time >= this.duration ) {
                this.time = this.duration;
                _activeInstances.remove( this.listItem );
            }
            for ( var propertyName in this.properties ) {
                this.object[propertyName] = this.ease(
                    this.time,
                    this.before[propertyName],
                    this.change[propertyName],
                    this.duration );
            }
            if ( this.options && this.time >= this.duration && this.options.onComplete ) {
                this.options.onComplete.apply( null, this.options.onCompleteParams );
            }
        }
    }
} )();

/*
Easing functions copied from: http://www.gizma.com/easing/
*/
tween.ease = {

    linear: function ( t, b, c, d ) {
        return c * t / d + b;
    },

    quadIn: function ( t, b, c, d ) {
        t /= d;
        return c*t*t + b;
    },

    quadOut: function ( t, b, c, d ) {
        t /= d;
        return -c * t*(t-2) + b;
    },

    quadInOut: function ( t, b, c, d ) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    },
    
    cubicIn : function (t, b, c, d) {
        t /= d;
        return c*t*t*t + b;
    },

    cubicOut: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t + 1) + b;
    },

    cubicInOut: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t + 2) + b;
    },
  
    quartIn: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t + b;
    },
    
    quartOut: function (t, b, c, d) {
        t /= d;
        t--;
        return -c * (t*t*t*t - 1) + b;
    },

    quartInOut: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t*t + b;
        t -= 2;
        return -c/2 * (t*t*t*t - 2) + b;
    },

    quintIn: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t*t + b;
    },

    quintOut: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t*t*t + 1) + b;
    },

    quintInOut: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t*t*t + 2) + b;
    },
		
    sineIn: function (t, b, c, d) {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
    },

    sineOut: function (t, b, c, d) {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
    },

    sineInOut: function (t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    },

    expoIn: function (t, b, c, d) {
        return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
    },

    expoOut: function (t, b, c, d) {
        return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
    },
    
    expoInOut: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
        t--;
        return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
    },
	
    circIn: function (t, b, c, d) {
        t /= d;
        return -c * (Math.sqrt(1 - t*t) - 1) + b;
    },
    
    circOut: function (t, b, c, d) {
        t /= d;
        t--;
        return c * Math.sqrt(1 - t*t) + b;
    },

    circInOut: function ( t, b, c, d ) {
        t /= d / 2;
        if ( t < 1 ) return -c / 2 * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
        t -= 2;
        return c / 2 * ( Math.sqrt( 1 - t * t ) + 1 ) + b;
    }
};