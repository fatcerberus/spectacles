/**
 * persist.js - store persistent data with maps and persons.
 *
 * persist.js lets you store variables with persons and maps.  It also
 * keeps them, even when you switch maps.  Data is kept in one place,
 * making it easy to save and load.
 *
 * persist.js also lets you write map scripts inside Sphere's code
 * editor, giving you F7 syntax checking, syntax highlighting, and
 * full editing comfort.
 *
 * Wiki: http://www.spheredev.org/wiki/Persist.js
 */

var persist = (function () {
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

    /************************************************************
     * Log layer: provide optional debug output to Sphere logs. *
     ************************************************************/

    /* Output log for debugging and tracing. */
    var log = null;
    var logging = false;
    var takeNotes = false;

    /**
     * Set an output log for debugging persist.js and its use.
     * @param debuglog {SphereLog} the log to output messages to
     */
    function setLog(debuglog)
    {
        log = debuglog;
    }

    /**
     * Begin logging of persist.js.
     * @param takenotes {boolean} include trace notes
     * @param debuglog {SphereLog} optional, the log to output messages to
     */
    function startLogging(takenotes, debuglog)
    {
        logging = true;
        takeNotes = takenotes || false;
        if (debuglog)
            log = debuglog;
    }

    /**
     * Stop sending 
     */
    function stopLogging()
    {
        logging = false;
    }

    /* Write an error message to the assigned log, or the default. */
    function logError(message)
    {
        if (!log)
            log = OpenLog("persist.js.log");
        log.write("Error: " + message);
    }

    /* Write a warning to the assigned log if logging is enabled. */
    function logWarn(message)
    {
        if (log && logging)
            log.write("Warning: " + message);
    }

    /* Write a note to the assigned log if logging is enabled. */
    function logNote(message)
    {
        if (log && logging && takeNotes)
            log.write("Note: " + message);
    }

    /****************************************
     * File layer: process paths and files. *
     ****************************************/

    /* Read in all the text in a file. */
    function readFile(path)
    {
        logNote("readFile: Opening " + path);
        var bytes;
        var f = OpenRawFile(path);
        try {
            bytes = f.read(f.getSize());
        } finally {
            f.close();
        }
        return CreateStringFromByteArray(bytes);
    }

    /* Path of the map script directory, relative to 'other/'.
     * Include the slash at the end. */
    var scriptPath = "../scripts/maps/";

    /**
     * Get the path of script files for maps, relative to 'other/'.
     * @returns {string} the script path
     */
    function getScriptPath()
    {
        return scriptPath;
    }

    /**
     * Set the path of script files for maps, relative to 'other/'.
     * @param newPath {string} the new path for map scripts
     */
    function setScriptPath(newPath)
    {
        scriptPath = newPath;
    }

    /* Split a path into file and directory components */
    function splitPath(path)
    {
        var filename = path.replace('\\', '/', 'g').split('/').reverse()[0];
        var directory = path.replace(filename, '');
        return {dir: directory, file: filename};
    }

    /* Check if a file exists in the directory. */
    function fileExists(path)
    {
        // relative to 'other/' because OpenRawFile defaults to it
        var pathBits = splitPath(path);
        var files = GetFileList('other/' + pathBits.dir);
        for (var f = 0; f < files.length; ++f) {
            if (pathBits.file == files[f])
                return true;
        }
        return false;
    }

    /* Get the map script file, given the map filename. */
    function scriptFromMap(map)
    {
        // Lose the '.rmp' extension
        var mapExt = '.rmp';
        var basePath = map.substring(0, map.length - mapExt.length);
        return scriptPath + basePath + '.js';
    }

    /* Load the script of the map into a string. */
    function loadMapScriptFile(map)
    {
        var script = scriptFromMap(map);
        logNote("loadMapScriptFile: Loading " + script + " for " + map);
        if (fileExists(script))
            return readFile(script);
        logWarn("loadMapScriptFile: Couldn't load " + script);
        return '({})';
    }

    /*******************************************************
     * State layer: manage world/map/person state objects. *
     *******************************************************/

    /* Tie an existing object to a prototype. */
    function tieToPrototype(obj, proto)
    {
        var protoTie = function () {};
        protoTie.prototype = proto;
        var newObj = new protoTie();
        for (var p in obj) {
            if (p in proto && typeof proto[p] == 'object')
                newObj[p] = tieToPrototype(obj[p], proto[p]);
            else
                newObj[p] = obj[p];
        }
        return newObj;
    }

    /* Holds all world/map/person state variables. */
    var world = {};

    /**
     * Get the state of the world.
     * @returns {Object} the world state
     */
    function getWorldState()
    {
        return world;
    }

    /**
     * Set the state of the world.
     * @param newWorld {Object} the new world state
     */
    function setWorldState(newWorld)
    {
        for (var map in newWorld)
            loadMapScript(map);
        // EVIL ABSTRACTION BREAKING USE OF scriptCache!
        world = tieToPrototype(newWorld, scriptCache);
    }

    /* List the persons to whom events should be attached. */
    function getImportantPersons()
    {
        var persons = [];
        for (var p = 0, plist = GetPersonList(); p < plist.length; ++p) {
            if (plist[p] != "" && (!IsInputAttached() || plist[p] != GetInputPerson()))
                persons.push(plist[p]);
        }
        return persons;
    }

    /* Check if a map state exists in the world. */
    function mapStateExists(map)
    {
        return map in getWorldState();
    }

    /* Make sure current map (and person) state variables are set. */
    function ensureState(mapname)
    {
        var map = mapname || GetCurrentMap();

        // If the map state exists, chances are its person states do too.
        // Also cuts this ugly circular call dependency:
        // ensureState -> initPersonState -> setPersonState -> getMapState -> ensureState
        // *whew*
        if (mapStateExists(map))
            return;

        logNote("ensureState: Ensuring state of " + map);
        var template = loadMapScript(map);
        logNote("ensureState: Preparing state of " + map + " with loaded script");
        initMapState(map, template);
        for (var p = 0, persons = getImportantPersons(); p < persons.length; ++p) {
            if (persons[p] in template) {
                logNote("ensureState: Preparing state of " + persons[p] + " in " + map + " with loaded script");
                initPersonState(map, persons[p], template[persons[p]]);
            }
        }
    }

    /**
     * Get the map state. Use via the alias 'persist.map(map)'.
     * @param map {string} optional, the name of the map
     * @returns reference to the map state object
     */
    function getMapState(map)
    {
        var mapChosen = map || GetCurrentMap();
        var ws = getWorldState();
        if (!mapStateExists(mapChosen))
            ensureState(mapChosen);
        return ws[mapChosen];
    }

    /* Set the state of a map. */
    function setMapState(map, newState)
    {
        var ws = getWorldState();
        ws[map] = newState;
    }

    /* Check if a person state exists in a map. */
    function personStateExists(map, person)
    {
        return mapStateExists(map) && (person in getMapState(map));
    }

    /**
     * Get the person state. Use via the alias 'persist.person(person, map)'.
     * @param map {string} optional, name of the map where the person is
     * @param person {string} optional, name of the person
     * @returns reference to the person state object
     */
    function getPersonState(map, person)
    {
        var personChosen = person || GetCurrentPerson();
        var ms = getMapState(map);
        if (personChosen in ms)
            return ms[personChosen];
        return ms[personChosen] = {};
    }

    /* Set the state of a person. */
    function setPersonState(map, person, newState)
    {
        var ms = getMapState(map);
        ms[person] = newState;
    }

    /* Check that a member of an object is not internal or a prototype member. */
    function isCustomMember(object, member)
    {
        return Object.prototype.hasOwnProperty.call(object, member) && Object.prototype.propertyIsEnumerable.call(object, member);
    }

    /* Check if a member is a map variable. */
    function isMapVariable(member)
    {
        for (var me = 0; me < mapEvents.length; ++me) {
            if (member == mapEvents[me].fn)
                return false;
        }

        for (var p in GetPersonList()) {
            if (member == p)
                return false;
        }

        return true;
    }

    /* Copy map variables from a map script object. */
    function initMapState(map, script)
    {
        var mapState = {};
        for (var element in script) {
            if (script[element] != 'function' && isCustomMember(script, element) && isMapVariable(element))
                mapState[element] = script[element];
        }
        setMapState(map, tieToPrototype(mapState, script));
    }

    /* Check if a member is a person variable. */
    function isPersonVariable(member)
    {
        for (var pe = 0; pe < personEvents.length; ++pe) {
            if (member == personEvents[pe].fn)
                return false;
        }
        return true;
    }

    /* Copy person variables from a person script object */
    function initPersonState(map, person, script)
    {
        var personState = {};
        for (var element in script) {
            if (typeof script[element] != 'function' && isCustomMember(script, element) && isPersonVariable(element))
                personState[element] = script[element];
        }
        setPersonState(map, person, tieToPrototype(personState, script));
    }

    /***********************************************************
     * Evaluation layer: eval files and manage loaded scripts. *
     ***********************************************************/

    /* Loaded map script objects. */
    var scriptCache = {};

    /* Evaluate the matching script for a map. */
    function loadMapScript(map)
    {
        if (map in scriptCache)
            return scriptCache[map];

        try {
            scriptCache[map] = eval(loadMapScriptFile(map));
        } catch (e) {
            logError("In script for " + map + ": " + e);
        }
        return scriptCache[map];
    }

    /* Run a map event script. */
    function runMapScript(map, event)
    {
        logNote("runMapScript: Preparing to run " + event + " of " + map);

        var mapScript = loadMapScript(map);
        if (event in mapScript) {
            logNote("runMapScript: Running " + event + " of " + map);
            mapScript[event](world[map], world);
        } else {
            logWarn("runMapScript: Couldn't find " + event + " for " + map);
        }
    }

    /* Run a person event script. */
    function runPersonScript(map, person, event)
    {
        if (event != 'generator')
            logNote("runPersonScript: Preparing to run " + event + " of " + person + " in "+ map);

        var mapScript = loadMapScript(map);
        if (person in mapScript && event in mapScript[person]) {
            if (event != 'generator')
                logNote("runPersonScript: Running " + event + " of " + person + " in " + map);
            mapScript[person][event](world[map][person], world[map], world);
        } else {
            if (event != 'generator')
                logWarn("runPersonScript: Couldn't find " + event + " for " + person + " in " + map);
        }
    }

    /**********************************************
     * Hook layer: define what happens in events. *
     **********************************************/

    /* Run a map event for the current map. */
    function triggerMapEvent(which)
    {
        if (!IsMapEngineRunning())
            return;

        var map = GetCurrentMap();
        try {
            runMapScript(map, which);
        } catch (e) {
            logError("triggerMapEvent: event " + which + " for " + map + ": " + e);
            Abort(e);
        }
    }

    /* Run a person event for the current person. */
    function triggerPersonEvent(which)
    {
        if (!IsMapEngineRunning())
            return;

        var map = GetCurrentMap();
        var person = GetCurrentPerson();
        try {
            runPersonScript(GetCurrentMap(), GetCurrentPerson(), which);
        } catch (e) {
            logError("triggerPersonEvent: event " + which + " for " + person + " on " + map + ": " + e);
            Abort(e);
        }
    }

    /* Re-run the create scripts of each person on the current map. */
    function recreatePersons()
    {
        logNote("recreatePersons: Re-running person SCRIPT_ON_CREATE events");
        var persons = getImportantPersons();
        for (var p = 0; p < persons.length; ++p)
            CallPersonScript(persons[p], SCRIPT_ON_CREATE);
    }

    /****************************************
     * Binding layer: wire events to hooks. *
     ****************************************/

    /* Connect map events to scripts. */
    function bindMapEvents()
    {
        logNote("bindMapEvents: Binding map events");
        for (var e = 0; e < mapEvents.length; ++e)
            SetDefaultMapScript(mapEvents[e].event, 'persist.triggerMapEvent("' + mapEvents[e].fn + '");');

        // Overwrite map enter event, it needs special handling.
        SetDefaultMapScript(SCRIPT_ON_ENTER_MAP, 'persist.ensureState(); ' +
                                                 'persist.bindPersonsEvents(); ' +
                                                 'persist.recreatePersons(); ' +
                                                 'persist.triggerMapEvent("enter"); ');
    }

    /* Disconnect map event scripts. */
    function unbindMapEvents()
    {
        logNote("unbindMapEvents: Unbinding map events");
        for (var e = 0; e < mapEvents.length; ++e)
            SetDefaultMapScript(mapEvents[e].event, '');
    }

    /* Connect events of all persons (sic) to scripts. */
    function bindPersonsEvents()
    {
        logNote("bindPersonsEvents: Binding person events");

        var mapScript = getMapState();
        var persons = getImportantPersons();
        for (var p = 0; p < persons.length; ++p) {
            for (var e = 0; e < personEvents.length; ++e) {
                if (persons[p] in mapScript && personEvents[e].fn in mapScript[persons[p]]) {
                    logNote("bindPersonsEvents: Binding " + personEvents[e].fn + " for " + persons[p]);
                    SetPersonScript(persons[p], personEvents[e].event, 'persist.triggerPersonEvent("' + personEvents[e].fn + '");');
                }
            }
        }
    }

    /* Disconnect events of all persons (sic) from scripts. */
    function unbindPersonsEvents()
    {
        if (!IsMapEngineRunning())
            return;

        logNote("unbindPersonsEvents: Unbinding person events");
        var persons = getImportantPersons();
        for (var p = 0; p < persons.length; ++p) {
            for (var e = 0; e < personEvents.length; ++e) {
                logNote("unbindPersonsEvents: Unbinding " + personEvents[e].fn + " from " + persons[p]);
                SetPersonScript(persons[p], personEvents[e].event, '');
            }
        }
    }

    /**
     * Activate the persist.js framework.
     */
    function init()
    {
        logNote("init: Preparing persist.js framework");
        setWorldState({});
        bindMapEvents();
    }

    /**
     * Deactivate the persist.js framework.
     */
    function stop()
    {
        logNote("stop: Stopping persist.js framework");
        unbindMapEvents();
        unbindPersonsEvents();
    }

    /*************
     * Interface *
     *************/
    return {
        // Use these...
        setLog: setLog,
        startLogging: startLogging,
        stopLogging: stopLogging,
        getScriptPath: getScriptPath,
        setScriptPath: setScriptPath,
        getWorldState: getWorldState,
        setWorldState: setWorldState,
        map: getMapState,
        person: function (person, map) { return getPersonState(map, person); },
        init: init,
        stop: stop,

        // ... not these!
        ensureState: ensureState,
        triggerMapEvent: triggerMapEvent,
        triggerPersonEvent: triggerPersonEvent,
        recreatePersons: recreatePersons,
        bindPersonsEvents: bindPersonsEvents,
    };
})();
