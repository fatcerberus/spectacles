/**
* Script: Link.js
* Written by: Andrew Helenius
* Updated: Jun/07/2014
* Version: 0.2.15
* Desc: Link.js is a very fast general-purpose functional programming library.
		Still somewhat experimental, and still under construction.
**/

var Link = (function() {
	"use strict";
	var _slice = [].slice;
	
	function _IndexOf(array, elem) {
		for (var i = 0, l = array.length; i < l; ++i) {
			if (array[i] === elem) return i;
		}
		return -1;
	};
	
	function _IsArray(a) {
		return Object.prototype.toString.call(a) === "[object Array]";
	}
	
	/** Point Layer **/

	function WherePoint(fn) {
		this.next = null;
		this.env  = null;
		this.func = fn;
	}
	
	WherePoint.prototype.exec = function(item) {
		if (this.func(item)) this.next.exec(item);
	}
	
	WherePoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			f = this.func, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { if (f(a[i])) n.exec(a[i]); i++; }
		else
			while (i < l) { if (f(a[i])) n.exec(a[i]); i++; }
	}

	function HasPoint(prop, item) {
		this.next = null;
		this.env  = null;
		this.item = item;
		this.prop = prop;
	}
	
	HasPoint.prototype.exec = function(item) {
		if (_IndexOf(item[this.prop], this.item) >= 0) this.next.exec(item);
	}

	function HasFuncPoint(prop, func) {
		this.next = null;
		this.env  = null;
		this.func = func;
		this.prop = prop;
	}
	
	HasFuncPoint.prototype.exec = function(item) {
		var array = item[this.prop];
		for (var i = 0, l = array.length; i < l; ++i) {
			if (this.func(array[i])) { this.next.exec(item); break; }
		}
	}
	
	function RejectPoint(fn) {
		this.next = null;
		this.env  = null;
		this.func = fn;
	}
	
	RejectPoint.prototype.exec = function(item) {
		if (!this.func(item)) this.next.exec(item);
	}
	
	RejectPoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env, f = this.func, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { if (!f(a[i])) n.exec(a[i]); i++; }
		else
			while (i < l) { if (!f(a[i])) n.exec(a[i]); i++; }
	}
		
	function FilterByPoint(key, values) {
		this.next = null;
		this.env  = null;
		this.key  = key;
		this.vals = values;
	}
	
	FilterByPoint.prototype.exec = function(item) {
		if (_IndexOf(this.vals, item[this.key])) this.next.exec(item);
	}
	
	FilterByPoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			k = this.key, v = this.vals, n = this.next;
		if (e.take)
			while (i < l && !e.stop) {
				if (_IndexOf(v, a[i][k]) >= 0) n.exec(a[i]);
				i++;
			}
		else
			while (i < l) {
				if (_IndexOf(v, a[i][k]) >= 0) n.exec(a[i]);
				i++;
			}
	}

	function FilterByOnePoint(key, val) {
		this.next = null;
		this.env  = null;
		this.key  = key;
		this.val  = val;
	}
	
	FilterByOnePoint.prototype.exec = function(item) {
		if (item[this.key] === this.val) this.next.exec(item);
	}
	
	FilterByOnePoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			v = this.val, k = this.key, n = this.next;
		if (e.take)
			while (!e.stop && i < l) { var p = a[i]; if (v === p[k]) n.exec(p); i++; }
		else
			while (i < l) { var p = a[i]; if (v === p[k]) n.exec(p); i++; }
	}
	
	function PluckPoint(prop) {
		this.next = null;
		this.env  = null;
		this.prop = prop;
	}
	
	PluckPoint.prototype.exec = function(item) {
		this.next.exec(item[this.prop], item);
	}
	
	PluckPoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env, k = this.prop, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { n.exec(a[i][k]); i++; }
		else
			while (i < l) { n.exec(a[i][k]); i++; }
	}
	
	function SelectPoint(args) {
		this.next = null;
		this.env  = null;
		this.args = args;
	}
	
	SelectPoint.prototype.exec = function(item) {
		var obj = { }, i = this.args.length;
		while (i--) {
			obj[this.args[i]] = item[this.args[i]];
		}
		this.next.exec(obj);
	}
	
	function JoinPoint(other, cond) {
		this.next  = null;
		this.env   = null;
		this.other = other;
		this.cond  = cond;
	}
	
	JoinPoint.prototype.exec = function(item) {
		for (var i = 0, l = this.other.length; i < l; ++i) {
			var other = this.other[i];
			if (this.cond(item, other)) {
				var obj = { };
				for (var j in other) obj[j] = other[j];
				for (var j in item) obj[j] = item[j];
				this.next.exec(obj);
			}
		}
	}

	function MapPoint(fn) {
		this.next = null;
		this.env  = null;
		this.func = fn;
	}
	
	MapPoint.prototype.exec = function(item) {
		this.next.exec(this.func(item));
	}
	
	MapPoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			f = this.func, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { n.exec(f(a[i])); i++; }
		else
			while (i < l) { n.exec(f(a[i])); i++; }
	}

	function Map2Point(fn1, fn2) {
		this.next = null;
		this.env  = null;
		this.map1 = fn1;
		this.map2 = fn2;
	}
	
	Map2Point.prototype.exec = function(item) {
		this.next.exec(this.map2(this.map1(item)));
	}
	
	Map2Point.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			f1 = this.map1, f2 = this.map2, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { n.exec(f2(f1(a[i]))); i++; }
		else
			while (i < l) { n.exec(f2(f1(a[i]))); i++; }
	}

	function WhereMapPoint(fn1, fn2) {
		this.next  = null;
		this.env   = null;
		this.where = fn1;
		this.map   = fn2;
	}
	
	WhereMapPoint.prototype.exec = function(item) {
		if (this.where(item)) this.next.exec(this.map(item));
	}
	
	WhereMapPoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			f1 = this.where, f2 = this.map, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { if (f1(a[i])) n.exec(f2(a[i])); i++; }
		else
			while (i < l) { if (f1(a[i])) n.exec(f2(a[i])); i++; }
	}

	function MapWherePoint(fn1, fn2) {
		this.next  = null;
		this.env   = null;
		this.map   = fn1;
		this.where = fn2;
	}
	
	MapWherePoint.prototype.exec = function(item) {
		var i = this.map(item);
		if (this.where(i)) this.next.exec(i);
	}

	MapWherePoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			f1 = this.where, f2 = this.map, n = this.next;
		if (e.take)
			while (i < l && !e.stop) {
				var v = f2(a[i]); if (f1(v)) n.exec(v); i++;
			}
		else
			while (i < l) {
				var v = f2(a[i]); if (f1(v)) n.exec(v); i++;
			}
	}

	function Where2Point(fn1, fn2) {
		this.next   = null;
		this.env    = null;
		this.where1 = fn1;
		this.where2 = fn2;
	}
	
	Where2Point.prototype.exec = function(item) {
		if (this.where1(item) && this.where2(item)) this.next.exec(item);
	}
	
	Where2Point.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env;
			f1 = this.where1, f2 = this.where2, n = this.next;
		if (e.take)
			while (i < l && !e.stop) {
				var v = a[i];
				if (f1(v) && f2(v)) n.exec(v); i++;
			}
		else
			while (i < l) {
				var v = a[i];
				if (f1(v) && f2(v)) n.exec(v); i++;
			}
		return i;
	}

	function ZipPoint(array) {
		this.next = null;
		this.env  = null;
		this.i    = 0;
	}

	ZipPoint.prototype.exec = function(item) { this.next.exec([item, array[this.i++]]); }
	
	ZipPoint.prototype.reset = function() { this.i = 0; }
	
	function GroupByPoint(groupFn) { // end point
		this.next  = null;
		this.env   = null;
		this.func  = groupFn;
		this.group = {};
	}
	
	GroupByPoint.prototype.exec = function(item) {
		var index = this.func(item);
		if (!this.group[index]) this.group[index] = [item];
		else this.group[index].push(item);
	}

	function SlicePoint(a, b) {
		this.next = null;
		this.env  = null;
		this.i    = 0;
		this.a    = a;
		this.b    = b;
	}

	SlicePoint.prototype.exec = function(item) {
		if (this.i >= this.b) { this.env.stop = true; this.i = 0; return; }
		else if (this.i >= this.a) this.next.exec(item);
		this.i++;
	}
	
	function FirstFuncPoint(fn) {
		this.next = null;
		this.env  = null;
		this.func = fn;
	}
	
	FirstFuncPoint.prototype.exec = function(item) {
		if (this.func(item)) { this.env.stop = true; this.next.exec(item); }
	}

	function FirstPoint() {
		this.next = null;
		this.env  = null;
	}
	
	FirstPoint.prototype.exec = function(item) {
		this.env.stop = true;
		this.next.exec(item);
	}
	
	function FirstCountPoint(num) {
		this.next = null;
		this.env  = null;
		this.num  = num;
		this.i    = 0;
	}
	
	FirstCountPoint.prototype.exec = function(item) {
		if (++this.i == this.num) this.env.stop = true;
		this.next.exec(item);
	}
	
	function UpdatePoint(prop, value) { // end point
		this.next = null;
		this.env  = null;
		this.prop = prop;
		this.val  = value;
	}
	
	UpdatePoint.prototype.exec = function(item) {
		item[this.prop] = this.val;
	}
	
	function IsPoint(inst) {
		this.next = null;
		this.env  = null;
		this.inst = inst;
	}
	
	IsPoint.prototype.exec = function(item) { if (item instanceof this.inst) this.next.exec(item); }
	
	IsPoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			ins = this.inst, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { if (a[i] instanceof ins) n.exec(a[i]); i++; }
		else
			while (i < l) { if (a[i] instanceof ins) n.exec(a[i]); i++; }
	}
	
	function TypePoint(type) {
		this.next = null;
		this.env  = null;
		this.type = type;
	}
	
	TypePoint.prototype.exec = function(item) { if (typeof item == this.type) this.next.exec(item); }
	
	TypePoint.prototype.run = function(a) {
		var i = 0, l = a.length, e = this.env,
			t = this.type, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { if (typeof a[i] == t) n.exec(a[i]); i++; }
		else
			while (i < l) { if (typeof a[i] == t) n.exec(a[i]); i++; }
	}
	
	function SkipPoint(n) {
		this.next = null;
		this.env  = null;
		this.n    = n;
		this.skip = 0;
	}
	
	SkipPoint.prototype.exec = function(item) {
		if (this.skip == this.n) { this.next.exec(item); }
		else this.skip++;
	}
	
	SkipPoint.prototype.reset = function() { this.skip = 0; }

	function GetPoint(n) {
		this.next = null;
		this.env  = null;
		this.c    = 0;
		this.n    = n;
		this.obj  = null;
	}
	
	GetPoint.prototype.exec = function(item) {
		if (this.c == this.n) {
			this.env.stop = true;
			this.obj = item;
		} this.c++;
	}

	function ContainsFuncPoint(fn) { // end point
		this.next = null;
		this.env  = null;
		this.func = fn;
		this.pass = false;
	}
	
	ContainsFuncPoint.prototype.exec = function(item) {
		if (this.func(item)) this.pass = this.env.stop = true;
	}
	
	function ContainsPoint(o) { // end point
		this.next = null;
		this.env  = null;
		this.obj  = o;
		this.pass = false;
	}
	
	ContainsPoint.prototype.exec = function(item) {
		if (item === this.obj) this.pass = this.env.stop = true;
	}
	
	ContainsPoint.prototype.run = function(a) {
		var i = 0, l = a.length, t = this.obj;
		while (i < l) { if (a[i++] === t) { this.pass = true; break; } }
	}
	
	function ContainsAnyPoint(array) { // end point
		this.next = null;
		this.env  = null;
		this.arr  = array;
		this.pass = false;
	}
	
	ContainsAnyPoint.prototype.exec = function(item) {
		if (_IndexOf(this.arr, item) >= 0) this.pass = this.env.stop = true;
	}
	
	ContainsAnyPoint.prototype.run = function(a) {
		var i = 0, l = a.length, arr = this.arr;
		while (i < l) {
			if (_IndexOf(this.arr, a[i++]) >= 0) { this.pass = true; break; }
		}
	}
	
	function EveryPoint(func) { // end point
		this.next = null;
		this.env  = null;
		this.pass = true;
		this.func = func;
	}

	EveryPoint.prototype.exec = function(item) {
		if (!this.func(item)) { this.pass = false; this.env.stop = true; }
	}
	
	function NonePoint(func) { // end point
		this.next = null;
		this.env  = null;
		this.pass = true;
		this.func = func;
	}
	
	NonePoint.prototype.exec = function(item) {
		if (this.func(item)) { this.pass = false; this.env.stop = true; }
	}

	function IndexOfPoint(v) { // end point
		this.next  = null;
		this.env   = null;
		this.value = v;
		this.index = 0;
		this.found = false;
	}
	
	IndexOfPoint.prototype.exec = function(item) {
		if (item == this.value) this.env.stop = this.found = true;
		else this.index++;
	}

	IndexOfPoint.prototype.run = function(a) {
		var i = 0, l = a.length, v = this.value, n = this.next;
		while (i < l) { if (a[i] == v) { this.index = i; this.found = true; break; } else i++; }
	}

	function IndexOfPropPoint(p, v) { // end point
		this.next  = null;
		this.env   = null;
		this.prop  = p;
		this.value = v;
		this.index = 0;
	}
	
	IndexOfPropPoint.prototype.exec = function(item) {
		if (item[this.prop] == this.value) this.env.stop = this.found = true;
		else this.index++;
	}
	
	IndexOfPropPoint.prototype.run = function(a) {
		var i = 0, l = a.length, p = this.prop, v = this.value, n = this.next;
		while (i < l) { if (a[i][p] == v) { this.index = i; this.found = true; break; } else i++; }
	}

	function EachPoint(fn) { this.exec = fn; }
	
	function MinPoint(rank) { // end point
		this.next  = null;
		this.env   = null;
		this.func  = rank;
		this.value = Number.MAX_VALUE;
		this.obj   = undefined;
	}
	
	MinPoint.prototype.exec = function(item) {
		var v = this.func(item);
		if (v < this.value) { this.value = v; this.obj = item; }
	}

	function MaxPoint(rank) { // end point
		this.next  = null;
		this.env   = null;
		this.func  = rank;
		this.value = Number.MIN_VALUE;
		this.obj   = undefined;
	}

	MaxPoint.prototype.exec = function(item) {
		var v = this.func(item);
		if (v > this.value) { this.value = v; this.obj = item; }
	}
	
	function InvokePoint(method) { // end point
		this.next = null;
		this.env  = null;
		this.name = method;
	}
	
	InvokePoint.prototype.exec = function(item) { item[this.name](); }
	
	InvokePoint.prototype.run = function(a) {
		var i = 0, l = a.length, n = this.name;
		while(i < l) { a[i++][n](); }
	}
	
	function InvokeArgsPoint(method, args) { // end point
		this.next = null;
		this.env  = null;
		this.name = method;
		this.args = args;
	}
	
	InvokeArgsPoint.prototype.exec = function(item) { item[this.name].apply(item, this.args); }
	
	InvokeArgsPoint.prototype.run = function(a) {
		var i = 0, l = a.length, n = this.name, args = this.args;
		while(i < l) { var m = a[i++]; m[n].apply(m, args); }
	}
	
	function ExpandPoint() {
		this.next = null;
		this.env  = null;
	}
	
	ExpandPoint.prototype.exec = function(item) {
		var i = 0, l = item.length, e = this.env, n = this.next;
		if (e.take)
			while (i < l && !e.stop) { n.exec(item[i]); i++; }
		else
			while (i < l) { n.exec(item[i]); i++; }
	}
	
	function ExpandPropPoint(prop) {
		this.next = null;
		this.env  = null;
		this.prop = prop;
	}
	
	ExpandPropPoint.prototype.exec = function(item) {
		var i = 0, a = item[this.prop], l = a.length;
		while (i < l) { this.next.exec(a[i]); i++; }
	}

	function TakePoint(size) {
		this.next = null;
		this.env  = null;
		this.i    = 0;
		this.num  = size;
	}
	
	TakePoint.prototype.exec = function(item) {
		this.next.exec(item);
		if (++this.i == this.num) { this.env.stop = true; this.i = 0; }
	}

	function CountPoint(func) { // end point
		this.next   = null;
		this.env    = null;
		this.func   = func;
		this.counts = { num: 0, total: 0 };
	}
	
	CountPoint.prototype.exec = function(item) {
		this.counts.total++;
		if (this.func(item)) this.counts.num++;
	}

	// true unique-ness testing is a near-impossible or made too damn slow in JS, so an approximation will do:
	function UniqPoint(test) {
		this.next = null;
		this.env  = null;
		this.test = test || false;
		this.set  = []; // for primitives
		this.ref  = []; // for object references
	}
	
	UniqPoint.prototype.exec = function(item) {
		if (typeof item == "object") {
			var i = this.ref.length;
			if (this.test)
				while (i--) { if (this.test(item, this.ref[i])) return; }
			else
				while (i--) { if (this.ref[i] == item) return; }
			this.ref.push(item);
			this.next.exec(item);
		}
		else if (!this.set[item]) { this.set[item] = true; this.next.exec(item); }
	}
	
	UniqPoint.prototype.reset = function() {
		this.set.length = 0;
		this.ref.length = 0;
	}

	function LengthPoint() { // end point
		this.next = null;
		this.env  = null;
		this.num  = 0;
	}
	
	LengthPoint.prototype.exec = function(item) { this.num++; }

	function ReducePoint(fn, m) { // end point
		this.next = null;
		this.env  = null;
		this.func = fn;
		this.memo = m;
	}
	
	ReducePoint.prototype.exec = function(item) {
		if (this.memo === undefined)
			this.memo = item;
		else
			this.memo = this.func(this.memo, item);
	}

	function AllPoint(array) { // end point
		this.next  = null;
		this.env   = null;
		this.i     = 0;
		this.array = [];
	}
	
	AllPoint.prototype.exec = function(item) { this.array[this.i++] = item; }
	
	AllPoint.prototype.run = function(a) {
		var i = 0, l = a.length, b = this.array;
		while (i < l) b[i] = a[i++];
	}
	
	/** Functional Layer **/

	function PushPoint(point) {
		point.env = this.env;
		var last  = this.points.length - 1;
		if (last >= 0) this.points[last].next = point;
		this.points.push(point);
	}
	
	function ReplaceEnd(point) {
		point.env = this.env;
		var last  = this.points.length - 1;
		this.points[last] = point;
		if (last > 0) this.points[last - 1].next = point;
	}
	
	function Each(fn) {
		this.run(new EachPoint(fn));
	}
		
	function Run(point) {
		this.env.stop = false;
		this.env.skip = 0;
		if (point) this.pushPoint(point);
		var start = this.points[0];
		
		// reset the points that store data between runs
		for (var i = 0; i < this.points.length; ++i) {
			var p = this.points[i];
			if (p.reset) p.reset();
		}

		// kick-start points that have a runner tied to them:
		if (start.run) { start.run(this.target); }
		else {
			var a = this.target, l = a.length, i = 0, e = this.env;
			if (e.take)
				while (i < l && !e.stop) start.exec(a[i++]);
			else
				while (i < l) start.exec(a[i++]);
		}
		this.points.length--;
	}
	
	function ToArray() {
		var point = new AllPoint();
		this.run(point);
		return point.array;
	}
	
	function Count(fn) {
		var point = new CountPoint(fn);
		this.run(point);
		return point.counts;
	}
	
	function Length() {
		var point = new LengthPoint();
		this.run(point);
		return point.num;
	}
	
	function Has(prop, value) {
		if (typeof value === "function")
			this.pushPoint(new HasFuncPoint(prop, value));
		else
			this.pushPoint(new HasPoint(prop, value));
		return this;
	}
	
	function Contains(o) {
		this.env.take = true;
		var point;
		if (typeof o == "function")
			point = new ContainsFuncPoint(o);
		else if (_IsArray(o))
			point = new ContainsAnyPoint(o);
		else
			point = new ContainsPoint(o);
		this.run(point);
		return point.pass;
	}
	
	function Update(prop, value) {
		this.run(new UpdatePoint(prop, value));
	}
	
	function IndexOf(p, v) {
		this.env.take = true;
		var point;
		if (v !== undefined)
			point = new IndexOfPropPoint(p, v);
		else
			point = new IndexOfPoint(p);
		this.run(point);
		return point.found ? point.index : -1;
	}
	
	function Pluck(prop) {
		this.pushPoint(new PluckPoint(prop));
		return this;
	}
	
	function GroupBy(fn) {
		var point = new GroupByPoint(fn);
		this.run(point);
		return point.group;
	}
	
	function FilterBy(key, a) {
		if (_IsArray(a))
			this.pushPoint(new FilterByPoint(key, a));
		else
			this.pushPoint(new FilterByOnePoint(key, a));
		return this;
	}
	
	function Every(fn) {
		this.env.take = true;
		var point = new EveryPoint(fn);
		this.run(point);
		return point.pass;
	}
	
	function None(fn) {
		this.env.take = true;
		var point = new NonePoint(fn);
		this.run(point);
		return point.pass;
	}
	
	function Expand(prop) {
		if (prop)
			this.pushPoint(new ExpandPropPoint(prop));
		else
			this.pushPoint(new ExpandPoint());
		return this;
	}
	
	function Reduce(agg, memo) {
		var point = new ReducePoint(agg, memo);
		this.run(point);
		return point.memo;
	}
		
	function Sample(num) {
		if (!num) num = 1;
		this.env.take = true;
		this.pushPoint(new SamplePoint(num));
		return this;
	}
		
	function Where(propOrFn, value) {
		if (value !== undefined) {
			this.pushPoint(new FilterByPoint(propOrFn, value));
			return this;
		}
		var last = this.points[this.points.length - 1];
		if (last instanceof WherePoint)
			this.replaceEnd(new Where2Point(last.func, propOrFn));
		else if (last instanceof MapPoint)
			this.replaceEnd(new MapWherePoint(last.func, propOrFn));
		else
			this.pushPoint(new WherePoint(propOrFn));
		return this;
	}
	
	function Reject(func) {
		this.pushPoint(new RejectPoint(func));
		return this;
	}
	
	function Map(func) {
		var last = this.points[this.points.length - 1];
		if (last instanceof WherePoint)
			this.replaceEnd(new WhereMapPoint(last.func, func));
		else if (last instanceof MapPoint)
			this.replaceEnd(new Map2Point(last.func, func));
		else
			this.pushPoint(new MapPoint(func));
		return this;
	}
	
	function Concat(array) {
		if (array instanceof Link) array = array.toArray();
		return Link(this.toArray(), array);
	}
	
	function Max(rank) {
		var point = new MaxPoint(rank);
		this.run(point);
		return point.obj;
	}
	
	function Min(rank) {
		var point = new MinPoint(rank);
		this.run(point);
		return point.obj;
	}
	
	function Invoke(name, args) {
		if (args === undefined)
			this.run(new InvokePoint(name));
		else
			this.run(new InvokeArgsPoint(name, _slice.call(arguments, 1)));
	}
	
	function Skip(num) {
		this.pushPoint(new SkipPoint(num));
		return this;
	}
	
	function Is(inst) {
		this.pushPoint(new IsPoint(inst));
		return this;
	}
	
	function Type(type) {
		this.pushPoint(new TypePoint(type));
		return this;
	}
	
	function First(o) {
		this.env.take = true;
		var point;
		if (typeof o == "function")
			point = new FirstFuncPoint(o);
		else if (typeof o == "number")
			return o < 0 ? undefined : this.take(o);
		else
			point = new FirstPoint();
		this.pushPoint(point);
		var a = this.toArray();
		return a.length > 0 ? a[0] : undefined;
	}
	
	function Zip(array) {
		this.pushPoint(new ZipPoint(array));
		return this;
	}
	
	function Slice(a, b) {
		if (a == 0) return this;
		this.env.take = true;
		if (!b) b = Number.MAX_VALUE;
		this.pushPoint(new SlicePoint(a, b));
		return this;
	}
	
	function Last(count) {
		var a = this.toArray();
		if (!count) count = 1;
		return a.splice(a.length - count);
	}
	
	function Sample(times) {
		if (!times) times = 1;
		var a = this.toArray();
		times = Math.min(times, a.length);
		var samples = [];
		while (times--) {
			var i = Math.floor(Math.random() * a.length);
			samples.push(a[i]);
			a.splice(i, 1);
		}
		return samples;
	}

	function Random(times) {
		if (!times) times = 1;
		var a = this.toArray();
		var samples = [];
		while (times--) {
			var i = Math.floor(Math.random() * a.length);
			samples.push(a[i]);
		}
		return samples;
	}
	
	function Select() {
		this.pushPoint(new SelectPoint([].slice.apply(arguments)));
		return this;
	}
	
	function Join(other, func) {
		this.pushPoint(new JoinPoint(other, func));
		return this;
	}
	
	function Take(n) {
		this.env.take = true;
		this.pushPoint(new TakePoint(n));
		return this;
	}
	
	function Get(num) {
		this.env.take = true;
		var point = new GetPoint(num);
		this.run(point);
		return point.obj;
	}
	
	function Uniq(test) {
		this.pushPoint(new UniqPoint(test));
		return this;
	}
	
	function Sort(f) {
		var v = this.toArray();
		if (f) v.sort(f); else v.sort();
		return v;
	}
	
	function Retarget(a) {
		this.target = a;
		return this;
	}
	
	/** Interface Layer **/
	
	function Chain(array, dim) {
		this.env    = { take: false, stop: false };
		this.target = array || [];
		this.points = [];
	}
	
	Chain.prototype = {
		pushPoint : PushPoint,
		replaceEnd: ReplaceEnd,
		run       : Run,
		retarget  : Retarget,

		accept    : Where,
		concat    : Concat,
		contains  : Contains,
		count     : Count,
		drop      : Skip,
		each      : Each,
		every     : Every,
		exists    : Contains,
		expand    : Expand,
		expandInto: Expand,
		filter    : Where,
		filterBy  : FilterBy,
		filterOut : Reject,
		first     : First,
		get       : Get,
		groupBy   : GroupBy,
		has       : Has,
		indexOf   : IndexOf,
		invoke    : Invoke,
		is        : Is,
		join      : Join,
		last      : Last,
		length    : Length,
		map       : Map,
		max       : Max,
		min       : Min,
		none      : None,
		pluck     : Pluck,
		random    : Random,
		reduce    : Reduce,
		reject    : Reject,
		sample    : Sample,
		select    : Select,
		size      : Length,
		skip      : Skip,
		slice     : Slice,
		some      : Contains,
		sort      : Sort,
		take      : Take,
		toArray   : ToArray,
		type      : Type,
		typeOf    : Type,
		uniq      : Uniq,
		unique    : Uniq,
		unroll    : Expand,
		update    : Update,
		where     : Where,
		whereBy   : FilterBy,
		zip       : Zip,
	}
		
	function Link(arr, test) {
		if (!test)
			return new Chain(arr);
		else {
			var a = _slice.call(arguments, 0);
			return (new Chain(a)).unroll();
		}
	}
	
	Link.create = function() {
		var args = _slice.call(arguments, 0),
			stop = args.length - 1,
			v    = args[stop],
			isFn = (typeof v == "function"),
			indices = [];
		
		function CreateArray(n) {
			if (n == stop) return (isFn) ? v.apply(this, indices) : v;
			var a = [], l = args[n], n = n + 1;
			for (var i = 0; i < l; ++i) {
				indices[n - 1] = i;
				a[i] = CreateArray(n);
			}
			return a;
		}
		
		return CreateArray(0);
	}
	
	Link.range = function(num) {
		var a = [];
		while (num--) { a[num] = num; }
		return a;
	}
	
	Link.alias = function(from, to) {
		Chain.prototype[to] = Chain.prototype[from];
		return this;
	}
	
	return Link;
})();
