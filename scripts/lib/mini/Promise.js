/**
 * minisphere Runtime 1.1b4 - (c) 2015 Fat Cerberus
 * A set of system scripts providing advanced, high-level functionality not
 * available in the engine itself.
 *
 * [mini/Promise.js]
 * A polyfill for the ES6 Promise object.
**/

Promise = (function(undefined)
{
	'use strict';
	
	function Promise(fn)
	{
		var deferred = [];
		var state = 'pending';
		var result = undefined;
		
		function handle(handler)
		{
			if (state == 'pending')
				deferred.push(handler);
			else {
				var callback = state == 'resolved' ? handler.fulfiller
					: state == 'rejected' ? handler.rejector
					: undefined;
				if (typeof callback !== 'function') {
					if (state == 'resolved') handler.resolve(result);
					if (state == 'rejected') handler.reject(result);
				} else if (state == 'rejected') {
					handler.reject(callback(result));
				} else {
					try {
						handler.resolve(callback(result));
					} catch(e) {
						handler.reject(e);
					}
				}
			}
		}
		
		function resolve(value)
		{
			try {
				if (value && typeof value.then === 'function') {
					value.then(resolve, reject);
					return;
				}
				state = 'resolved';
				result = value;
				for (var i = 0; i < deferred.length; ++i)
					handle(deferred[i]);
				deferred = [];
			} catch(e) {
				reject(e);
			}
		}
		
		function reject(reason)
		{
			state = 'rejected'
			result = reason;
			for (var i = 0; i < deferred.length; ++i)
				handle(deferred[i]);
			deferred = [];
		}
		
		this.catch = function(errback)
		{
			return this.then(undefined, errback);
		};
		
		this.then = function(callback, errback)
		{
			return new Promise(function(resolve, reject) {
				handle({
					resolve: resolve, reject: reject,
					fulfiller: callback,
					rejector: errback
				});
			});
		};
		
		this.done = function(callback, errback)
		{
			var self = arguments.length > 0 ? this.then.apply(this, arguments) : this;
			if (typeof errback !== 'function')
				self.catch(function(reason) { throw reason; });
		};
		
		fn(resolve, reject);
	};
	
	Promise.reject = function(reason)
	{
		return new Promise(function(resolve, reject) {
			reject(reason);
		});
	}
	
	Promise.resolve = function(value)
	{
		return new Promise(function(resolve, reject) {
			resolve(value);
		});
	}
	
	return Promise;
})();
