Torus.ui.render = function(el) {
	if(!el) {el = Torus.ui.ids['window'];}
	var rooms = [];
	var indexes = [];
	var active = false;
	if(Torus.ui.active != Torus.chats[0]) {
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(Torus.ui.viewing[i] == Torus.ui.active) {active = true;}
			if(Torus.logs.messages[Torus.ui.viewing[i].domain].length > 0) {
				rooms.push(Torus.logs.messages[Torus.ui.viewing[i].domain]);
				indexes.push(Torus.logs.messages[Torus.ui.viewing[i].domain].length - 1);
			}
		}
	}
	if(!active && Torus.logs.messages[Torus.ui.active.domain].length > 0) {
		rooms.push(Torus.logs.messages[Torus.ui.active.domain]);
		indexes.push(Torus.logs.messages[Torus.ui.active.domain].length - 1);
	}

	var bar = false;
	var frag = document.createDocumentFragment(); //yo these things are so cool
	for(var i = 0; (Torus.options.ui_maxmessages == 0 || i < Torus.options.ui_maxmessages) && rooms.length > 0; i++) {
		var message = rooms[0][indexes[0]];
		var source = 0;
		for(var j = 1; j < rooms.length; j++) {
			if(rooms[j][indexes[j]].id > message.id) {
				message = rooms[j][indexes[j]];
				source = j;
			}
		}
		indexes[source]--;
		if(indexes[source] == -1) { //no more messages
			rooms.splice(source, 1);
			indexes.splice(source, 1);
		}

		if(!bar && message.id < Torus.ui.active.last_viewed) {
			var hr = document.createElement('hr');
			hr.className = 'torus-message-separator';
			if(frag.children.length == 0) {frag.appendChild(hr);}
			else {frag.insertBefore(hr, frag.firstChild);}
			bar = true;
		}
		if(frag.children.length == 0) {frag.appendChild(Torus.ui.render_line(message));}
		else {frag.insertBefore(Torus.ui.render_line(message), frag.firstChild);}
	}
	el.appendChild(frag);

	//rerender userlist
	//FIXME: now that this is a generalized function, should we still do this or move it somewhere else?
	if(Torus.ui.active.id > 0) {
		//FIXME: this is really hacky
		var e = {room: Torus.ui.active};
		for(var i in Torus.ui.active.userlist) {
			e.user = i;
			Torus.ui.update_user(e);
		}
	}

	el.scrollTop = el.scrollHeight;

	var event = new Torus.classes.UIEvent('render');
	event.target = el;
	Torus.call_listeners(event);
}

Torus.ui.render_line = function(message) {
	if(message.type != 'io') {throw new Error('Torus.ui.render_line: Event type must be `io`.');}

	var line = document.createElement('div');
	line.classList.add('torus-message');
	line.classList.add('torus-room-' + message.room.domain);
	if(message.ping) {line.classList.add('torus-message-ping');}
	if(message.room != Torus.ui.active) {line.classList.add('torus-message-inactive');}
	var time = document.createElement('span');
		time.className = 'torus-message-timestamp';
		time.textContent = '[' + Torus.util.timestamp(message.time, Torus.options.ui_timezone) + ']';
	line.appendChild(time);
	var viewing = Torus.ui.viewing.length;
	if(Torus.ui.viewing.indexOf(Torus.chats[0]) != -1) {viewing--;}
	if(Torus.ui.viewing.indexOf(Torus.ui.active) != -1) {viewing--;}
	if(viewing > 0) {
		var max = message.room.name.length;
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(max < Torus.ui.viewing[i].name.length) {max = Torus.ui.viewing[i].name.length;}
		}
		if(max < Torus.ui.active.name.length) {max = Torus.ui.active.name.length;}
		max -= message.room.name.length;
		var indent = '';
		for(var i = 0; i < max; i++) {indent += ' ';}

		line.appendChild(document.createTextNode(' '));
		var room = document.createElement('span');
			room.className = 'torus-message-room';
			room.textContent = '{' + message.room.name + '}';
		line.appendChild(room);
		var span = document.createElement('span');
			span.className = 'torus-whitespace';
			span.textContent = indent;
		line.appendChild(span);
	}
	line.appendChild(document.createTextNode(' '));

	switch(message.event) {
		case 'me':
		case 'message':
			if(message.event == 'message') {
				var span = document.createElement('span'); //this is arguably one of the dumber things i've ever done
				span.className = 'torus-whitespace'; //it works though
				span.textContent = '  '; //#yolo
				line.appendChild(span);
				line.appendChild(document.createTextNode('<'));
				line.appendChild(Torus.ui.span_user(message.user));
				line.appendChild(document.createTextNode('> '));
			}
			else {
				line.appendChild(document.createTextNode('*'));
				var span = document.createElement('span'); //this is arguably one of the dumber things i've ever done
				span.className = 'torus-whitespace'; //it works though
				span.textContent = '  '; //#yolo
				line.appendChild(span);
				line.appendChild(Torus.ui.span_user(message.user));
				line.appendChild(document.createTextNode(' '));
			}
			line.appendChild(message.html);
			break;
		case 'alert':
			line.appendChild(document.createTextNode('== '));
			line.appendChild(message.html);
			break;
		case 'join':
		case 'rejoin':
		case 'ghost':
		case 'part':
			line.appendChild(document.createTextNode('== '));
			line.appendChild(Torus.i18n.html('message-' + message.event, Torus.ui.span_user(message.user), document.createTextNode('{' + message.room.name + '}')));
			break;
		case 'logout':
			line.appendChild(document.createTextNode('== '));
			line.appendChild(Torus.i18n.html('message-logout', Torus.ui.span_user(message.user)));
			break;
		case 'ctcp':
			if(message.user == wgUserName) {line.appendChild(document.createTextNode(' >'));}
			else {line.appendChild(document.createTextNode(' <'));}
			var span = document.createElement('span'); //this is arguably one of the dumber things i've ever done
			span.className = 'torus-whitespace'; //it works though
			span.textContent = '  '; //#yolo
			line.appendChild(span);
			line.appendChild(Torus.ui.span_user(message.user));
			if(!message.data) {line.appendChild(document.createTextNode(' CTCP|' + message.target + '|' + message.proto));}
			else {line.appendChild(document.createTextNode(' CTCP|' + message.target + '|' + message.proto + ': ' + message.data));}
			break;
		case 'mod':
			line.appendChild(document.createTextNode('== '));
			line.appendChild(Torus.i18n.html('message-mod', Torus.ui.span_user(message.performer), Torus.ui.span_user(message.target), document.createTextNode('{' + message.room.name + '}')));
			break;
		case 'kick':
		case 'ban':
		case 'unban':
			if(message.room.parent) {var domain = message.room.parent.domain;}
			else {var domain = message.room.domain;}

			var frag = document.createDocumentFragment();
			frag.appendChild(Torus.ui.span_user(message.target));
			frag.appendChild(document.createTextNode(' ('));
			var talk = document.createElement('a');
				talk.href = 'http://' + domain + '.wikia.com/wiki/User_talk:' + message.target;
				talk.textContent = Torus.i18n.text('message-banlinks-talk');
				talk.addEventListener('click', Torus.ui.click_link);
			frag.appendChild(talk);
			frag.appendChild(document.createTextNode('|'));
			var contribs = document.createElement('a');
				contribs.href = 'http://' + domain + '.wikia.com/wiki/Special:Contributions/' + message.target;
				contribs.textContent = Torus.i18n.text('message-banlinks-contribs');
				contribs.addEventListener('click', Torus.ui.click_link);
			frag.appendChild(contribs);
			frag.appendChild(document.createTextNode('|'));
			var ban = document.createElement('a');
				ban.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + message.target;
				ban.textContent = Torus.i18n.text('message-banlinks-history');
				ban.addEventListener('click', Torus.ui.click_link);
			frag.appendChild(ban);
			if(message.room.checkuser) {
				frag.appendChild(document.createTextNode('|'));
				var ccon = document.createElement('a');
					ccon.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + message.target;
					ccon.textContent = Torus.i18n.text('message-banlinks-chatconnect');
					ccon.addEventListener('click', Torus.ui.click_link);
				frag.appendChild(ccon);
			}
			frag.appendChild(document.createTextNode(')'));

			line.appendChild(document.createTextNode('== '));
			line.appendChild(Torus.i18n.html('message-' + message.event, Torus.ui.span_user(message.performer), frag, document.createTextNode('{' + message.room.name + '}'), document.createTextNode(message.expiry)));
			break;
		case 'error':
			var args = [message.error];
			for(var i = 0; i < message.args.length; i++) {args.push(message.args[i]);}
			line.appendChild(document.createTextNode('== ' + Torus.i18n.text.apply(Torus, args)));
			break;
		default: throw new Error('Message type ' + message.event + ' is not rendered. (ui.render_line)');
	}
	return line;
}
