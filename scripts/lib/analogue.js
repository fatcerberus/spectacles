/**
* Script: analogue.js
* Written by: Radnen
* Updated: 6/28/2013
**/

/*
	A lightweight alternative, and fully-compatible version
	of tung's persist code.
	
	Main Change:
	----------------------------------------------------------
	All objects are represented as native JS objects.
	And setting the world will merge the saved world
	with the existing world without breaking some things.
*/

var analogue = (function() {
    var mapEvents = [{fn:'enter',      event:SCRIPT_ON_ENTER_MAP},
                     {fn:'leave',      event:SCRIPT_ON_LEAVE_MAP},
                     {fn:'leaveNorth', event:SCRIPT_ON_LEAVE_MAP_NORTH},
                     {fn:'leaveSouth', event:SCRIPT_ON_LEAVE_MAP_SOUTH},
                     {fn:'leaveEast',  event:SCRIPT_ON_LEAVE_MAP_EAST},
                     {fn:'leaveWest',  event:SCRIPT_ON_LEAVE_MAP_WEST}];
    var personEvents = [{fn:'create',    event:SCRIPT_ON_CREATE},
                        {fn:'destroy',   event:SCRIPT_ON_DESTROY},
                        {fn:'touch',     event:SCRIPT_ON_ACTIVATE_TOUCH},
                        {fn:'talk',      event:SCRIPT_ON_ACTIVATE_TALK},
                        {fn:'generator', event:SCRIPT_COMMAND_GENERATOR}];
						
	var scriptPath = "../scripts/maps/";
	var world = {};
	
	/* Script Layer */
	
	function GetScriptName(mapfile) {
		return scriptPath + mapfile.substr(0, mapfile.length-4) + ".js";
	}
	
	function PathExists(file) {
		var parts    = file.replace(/\\/, "/").replace(/../, "~").split("/");
		var filename = parts.pop();
		var dir      = parts.join("/");
		var files    = GetFileList(dir);
		
		for (var f = 0; f < files.length; ++f) {
			if (filename == files[f]) return true;
		}
		
		return false;
	}
	
	function LoadMapScript(mapfile) {
		var scriptfile = GetScriptName(mapfile);
		
		if (!PathExists(scriptfile)) return "({})";
		
		var file = OpenRawFile(scriptfile);
		var bytearray;
		
		try {
			bytearray = file.read(file.getSize());
		}
		finally {
			file.close();
		}
		
		return CreateStringFromByteArray(bytearray);
	}

	/* Map Layer */

	function GetMap(mapfile) {
		if (mapfile in world) return world[mapfile];
		world[mapfile] = eval(LoadMapScript(mapfile));
		return world[mapfile];
	}
	
	function RunMapEvent(map, event) {
		var map = GetMap(map);
		if (event in map) map[event](map, world);
	}
		
	function InitMap() {
		BindPersonEvents();
		RecreatePersons();
		RunMapEvent(GetCurrentMap(), 'enter');
	}
	
	function BindMapEvents() {
		for (var i = 0; i < mapEvents.length; ++i) {
			SetDefaultMapScript(mapEvents[i].event, "analogue.runMapEvent(GetCurrentMap(), '" + mapEvents[i].fn + "');");
		}
		SetDefaultMapScript(SCRIPT_ON_ENTER_MAP, "analogue.initMap();");
	}
	
	/* Person Layer */
	
	function RunPersonEvent(map, name, event) {
		var map = GetMap(map);
		if (name in map) {
			if (event in map[name]) {
				map[name][event](map[name], map, world);
			}
		}
	}

	function BindPersonEvents() {
		var map = GetMap(GetCurrentMap());
		for (var i = 0, list = GetPersonList(); i < list.length; ++i) {
			if (list[i] == "" || (IsInputAttached() && list[i] == GetInputPerson())) continue;
			for (var j = 0; j < personEvents.length; ++j) {
				SetPersonScript(list[i], personEvents[j].event, "analogue.runPersonEvent(GetCurrentMap(), '" + list[i] + "', '" + personEvents[j].fn + "');");
			}
		}
	}
	
	function RecreatePersons() {
		for (var i = 0, list = GetPersonList(); i < list.length; ++i) {
			if (list[i] == "" || (IsInputAttached() && list[i] == GetInputPerson())) continue;
			CallPersonScript(list[i], SCRIPT_ON_CREATE);
		}
	}
	
	/* Interface Layer */
	
	function Init() {
		BindMapEvents();
	}
	
	function Absorb(A, B) {
		if (A === null) return null;
		if (A === undefined) return undefined;
		
		for (var i in B) {
			if (B[i] instanceof Array)
				A[i] = Absorb([], B[i]);
			else if (typeof B[i] == "object") {
				if (B[i] === null) { A[i] = null; return; };
				A[i] = Absorb(A[i], B[i]);
			}
			else
				A[i] = B[i];
		}
		return A;
	}
	
	function SetWorld(data) {
		world = {};
		
		// since we don't have maps in maps, we can load those that were
		// touched by the old saved data:
		for (var i in data) {
			if (i.indexOf(".rmp") >= 0) GetMap(i);
		}
		
		Absorb(world, data);
	}
	
	function GetThisMap() {
		return GetMap(GetCurrentMap());
	}
	
	return ({
		get world() { return world; },
		set world(o) { SetWorld(o); },
		setWorld: SetWorld,
		runMapEvent: RunMapEvent,
		runPersonEvent: RunPersonEvent,
		init: Init,
		initMap: InitMap,
		map: GetThisMap,
	});
}());