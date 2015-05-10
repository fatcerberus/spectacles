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
					handler.reject(callback.call(handler.promise, result));
				} else {
					try {
						handler.resolve(callback.call(handler.promise, result));
					} catch(e) {
						handler.reject(e);
					}
				}
			}
		}
		
		function resolve(value)
		{
			if (state != 'pending') return;
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
			if (state != 'pending') return;
			state = 'rejected'
			result = reason;
			for (var i = 0; i < deferred.length; ++i)
				handle(deferred[i]);
			deferred = [];
		}
		
		this.toString = function()
		{
			return state != 'pending'
				? "[" + state + " promise (" + result + ")]"
				: "[pending promise]";
		}
		
		this.catch = function(errback)
		{
			return this.then(undefined, errback);
		};
		
		this.then = function(callback, errback)
		{
			var promise = this;
			return new Promise(function(resolve, reject) {
				handle({
					promise: promise,
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
		
		fn.call(this, resolve, reject);
	};
	
	Promise.all = function(iterable)
	{
		return new Promise(function(resolve, reject) {
			var promises = [];
			var values = [];
			var numPromises = iterable.length;
			for (var i = 0; i < numPromises; ++i) {
				var v = iterable[i];
				if (!v || typeof v.then !== 'function')
					v = Promise.resolve(v);
				promises.push(v);
				v.then(function(value) {
					values.push(value);
					if (values.length == numPromises)
						resolve(values);
				}, function(reason) {
					reject(reason);
				});
			}
		});
	};
	
	Promise.race = function(iterable)
	{
		return new Promise(function(resolve, reject) {
			var numPromises = iterable.length;
			for (var i = 0; i < numPromises; ++i) {
				var v = iterable[i];
				if (!v || typeof v.then !== 'function')
					v = Promise.resolve(v);
				v.then(function(value) { resolve(value); },
					function(reason) { reject(reason); });
			}
		});
	};
	
	Promise.reject = function(reason)
	{
		return new Promise(function(resolve, reject) {
			reject(reason);
		});
	}
	
	Promise.resolve = function(value)
	{
		if (value instanceof Promise) return value;
		return new Promise(function(resolve, reject) {
			resolve(value);
		});
	}
	
	return Promise;
})();

// EmptyPromise constructor
// An EmptyPromise will never be fulfilled or rejected; it will remain
// pending forever. Kind of depressing symbolism, huh? :o)
function EmptyPromise() {}
EmptyPromise.prototype = new Promise(function() {});
EmptyPromise.prototype.toString = function() { return "[empty promise]"; };
