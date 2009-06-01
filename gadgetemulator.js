
// Gadget emulator that fakes just enough of the Google Wave gadget API
// to let a gadget run in two iframes.

function Wave() {
}
	
function Gadgets() {
}

Gadgets.prototype = {

	_add_participant: function(id,part, name, thumb) {
		if (!this._participants) { this._participants = new Array(); }
		this._participants.push({id: id, part: part, displayName: name, thumbnailUrl: thumb});
		return id;
	},

	_load: function(url) {
		$.ajax({type: "GET", url: url, dataType: "xml", success: function(xml) {
			var text = $(xml).find("Content").text();
			for (var p in gadgets._participants) {
				var part = gadgets._participants[p];
				var doc = part.part.document;
				doc.write("<script src=\"jquery-1.3.2.min.js\"></script>");
				doc.write("<script>var _participant_id="+part.id+";</script>");
				doc.write("<script src=\"gadgetemulator.js\"></script>");
				doc.write("<h3>Participant "+part.id+" - " +part.displayName+"</strong>");
				doc.write(text);
				doc.write("<script>gadgets.util._ready()</script>");
			}
		}, error: function() { alert("Load failed"); }
   	  })
	},

	// --- To be called in the participant frames ---

	_sendState: function() {
		var s = this._rpc["wave_gadget_state"];
		var state = this._state || {};
		$('#state').val(wave.util.printJson(state, true, 2));
		for (var cb in s) {
			s[cb].cb(state);
		}
	},

	_sendParticipants: function() {
		var s = this._rpc["wave_participants"];
		var p = this._participants;
		var part = [];
		for (var i in p) {
			part.push(p[i]);
		}
		var ob = {myId: 0, authorId: 0, participants: part};
		for (var cb in s) {
			ob.myId = s[cb].part;
			s[cb].cb(ob);
		}
	},

	_call: function(cmd,a) {
		if (cmd == "wave_gadget_state") {
			var dirty = false;
			this._state = this._state || {};
			for (var i in a) {
				if (a[i] != this._state[i]) {
					this._state[i] = a[i];
					dirty = true;
				}
			}
			if (dirty) this._sendState();
		} else if (cmd == "wave_enable") {
			this._sendState();
			this._sendParticipants();
		} else {
	 		alert("Unhandled RPC command: "+cmd);
		}
	},

	_register: function(partid, endpoint, cb) {
		this._rpc = this._rpc || {};
		this._rpc[endpoint] = this._rpc[endpoint] || [];
		this._rpc[endpoint].push({part: partid, cb: cb});
	},

	util: { 
		registerOnLoadHandler: function(f) {
		this._onload_handler = f;
	f();
		},
		_ready: function() {
			if (this._onload_handler) this._onload_handler();
		},
		getUrlParameters: function() { return {wave: new Wave()}; }
	},

	rpc: { 
		call: function(arg1, cmd, arg2, params) {
			window.top.gadgets._call(cmd,params);
		},
		register: function(endpoint, cb) {
			window.top.gadgets._register(_participant_id,endpoint,cb);
		}
	}
}

var gadgets = new Gadgets();

