/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2015 Power-Command
***/

function SpecsServer()
{
	this.socket = new Server(812, 10);
	this.connections = [];
	if (this.socket != null) {
		this.thread = threads.create(this);
		terminal.log("Specs server started running on port 812");
	} else {
		terminal.log("Couldn't start Specs server");
	}
}

SpecsServer.prototype.dispose = function()
{
	threads.kill(this.thread);
	this.socket.close();
};

SpecsServer.prototype.update = function()
{
	var socket = this.socket.accept();
	if (socket != null) {
		terminal.log("Accepted connection from " + socket.getRemoteAddress() + ":" + socket.getRemotePort());
		this.connections.push(new SpecsServerSocket(socket));
	}
	for (var i = 0; i < this.connections.length; ++i) {
		if (!this.connections[i].isConnected()) {
			var ip = this.connections[i].ip;
			var port = this.connections[i].port;
			terminal.log(ip + ":" + port + " has disconnected");
			this.connections[i].dispose();
			this.connections.splice(i, 1);
			--i;
		}
	}
	return true;
};

function SpecsServerSocket(socket)
{
	this.socket = socket;
	this.ip = this.socket.getRemoteAddress();
	this.port = this.socket.getRemotePort();
	this.isSpecsClient = false;
	this.timeoutAt = GetTime() + 1000;
	socket.write('specs client?\n');
	this.thread = Threads.createEntityThread(this);
	this.disposed = false;
}

SpecsServerSocket.prototype.dispose = function()
{
	this.socket.close();
	Threads.kill(this.thread);
}

SpecsServerSocket.prototype.update = function()
{
	if (!this.isConnected()) return true;
	var pendingBytes = this.socket.getPendingReadSize();
	var lines = [];
	if (pendingBytes > 0) {
		lines = this.socket.readString(pendingBytes).split('\n');
	}
	for (var i = 0; i < lines.length; ++i) {
		if (lines[i] == 'specs client.' && !this.isSpecsClient) {
			terminal.log(this.ip + ":" + this.port + " is a Specs Engine client");
			this.isSpecsClient = true;
		}
		if (!this.isSpecsClient) continue;
		if (lines[i].substr(0, 10) == 'person-id ') {
			this.person = lines[i].substr(10);
			terminal.log(this.ip + ":" + this.port + " took control of '" + this.person + "'");
		} else if (this.person != null) {
			switch(lines[i]) {
				case 'n':
					QueuePersonCommand(this.person, COMMAND_MOVE_NORTH, true);
					QueuePersonCommand(this.person, COMMAND_FACE_NORTH, false);
					break;
				case 'e':
					QueuePersonCommand(this.person, COMMAND_MOVE_EAST, true);
					QueuePersonCommand(this.person, COMMAND_FACE_EAST, false);
					break;
				case 's':
					QueuePersonCommand(this.person, COMMAND_MOVE_SOUTH, true);
					QueuePersonCommand(this.person, COMMAND_FACE_SOUTH, false);
					break;
				case 'w':
					QueuePersonCommand(this.person, COMMAND_MOVE_WEST, true);
					QueuePersonCommand(this.person, COMMAND_FACE_WEST, false);
					break;
			}
		}
	}
	return true;
};

SpecsServerSocket.prototype.isConnected = function()
{
	if (!this.isSpecsClient) {
		return GetTime() < this.timeoutAt;
	} else {
		return this.socket.isConnected();
	}
};
