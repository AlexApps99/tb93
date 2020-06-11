const io = require("socket.io-client");
const he = require("he");
const inspect = Symbol.for('nodejs.util.inspect.custom');

function decode(val) {
  if (typeof val === "string") {
    return he.decode(val);
  } else {
    return undefined;
  }
}

function atob(val) {
  return Buffer.from(val, 'base64').toString('binary');
}

class User {
  constructor(nick, color, style, home) {
    this.nick = typeof nick === "string" ? nick : "anonymous";
    this.color = typeof color === "string" ? color : "";
    this.style = typeof style === "string" ? style : "";
    this.home = typeof home === "string" ? home : "";
  }

  toString() {
    return this.nick;
  }

  [inspect]() {
    return this.toString();
  }
}

class Message {
  constructor(content, date, user) {
    this.content = typeof content === "string" ? content : "";
    this.date = typeof date === "number" && Number.isInteger(date) ? new Date(date) : null;
    this.user = user instanceof User ? user : null;
  }

  toString() {
    return this.content;
  }

  [inspect]() {
    return this.toString();
  }
}

class Trollbox {
  constructor(user, emulateBrowser, server) {
    if (typeof server !== "string" && emulateBrowser !== true) console.warn("Connecting to W93 Trollbox will not work unless you enable emulateBrowser. Use at your own risk!");
    this.server = typeof server === "string" ? server : "http://www.windows93.net:8081";
    this.user = user instanceof User ? user : (typeof user === "string" ? new User(user) : new User());
    let url = new URL(this.server);

    if (emulateBrowser == true) {
      // Not well obfuscated, but hopefully enough to
      // demonstrate that this is not supported and I
      // don't recommend making a bot for Trollbox
      // as they are usually spammy and annoying.
      this.socket = eval(atob("aW8odGhpcy5zZXJ2ZXIse2ZvcmNlTmV3OiEwLHRyYW5zcG9ydE9wdGlvbnM6e3BvbGxpbmc6e2V4dHJhSGVhZGVyczp7QWNjZXB0OiIqLyoiLCJBY2NlcHQtRW5jb2RpbmciOiJpZGVudGl0eSIsIkFjY2VwdC1MYW5ndWFnZSI6IioiLCJDYWNoZS1Db250cm9sIjoibm8tY2FjaGUiLENvbm5lY3Rpb246ImtlZXAtYWxpdmUiLENvb2tpZToiIixIb3N0OnVybC5ob3N0LE9yaWdpbjp1cmwucHJvdG9jb2wrIi8vIit1cmwuaG9zdG5hbWUsUHJhZ21hOiJuby1jYWNoZSIsUmVmZXJlcjp1cmwucHJvdG9jb2wrIi8vIit1cmwuaG9zdG5hbWUrIi90cm9sbGJveC8iLCJVc2VyLUFnZW50IjoiTW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvODMuMC40MTAzLjYxIFNhZmFyaS81MzcuMzYifX19fSk"));
    } else {
      this.socket = io(this.server, { forceNew: true });
    }
    this.on_message = function(message) {};
    this.on_user_joined = function(user) {};
    this.on_user_left = function(user) {};
    this.on_user_change_nick = function(previous, current) {};
    this.on_update_users = function(users) {};
    this.on_error = function(err) { console.error(err); };

    this.socket.on("message", data => {
      if (!data || typeof data.msg !== "string" || typeof data.nick !== "string") return;
      try {
        this.on_message(
          new Message(
            decode(data.msg),
            data.date,
            new User(
              decode(data.nick),
              decode(data.color),
              decode(data.style),
              data.home
            )
          )
        );
      } catch (err) {
        this.on_error(err);
      }
    });

    this.socket.on("user joined", data => {
      try {
        this.on_user_joined(
          new User(decode(data.nick), decode(data.color),  decode(data.style), data.home)
        );
      } catch (err) {
        this.on_error(err);
      }
    });

    this.socket.on("user left", data => {
      try {
        this.on_user_left(
          new User(decode(data.nick), decode(data.color), decode(data.style), data.home)
        );
      } catch (err) {
        this.on_error(err);
      }
    });

    this.socket.on("user change nick", data => {
      try {
        this.on_user_change_nick(
          new User(decode(data[0].nick), decode(data[0].color), decode(data[0].style), data[1].home),
          new User(decode(data[1].nick), decode(data[1].color), decode(data[1].style), data[1].home)
        );
      } catch (err) {
        this.on_error(err);
      }
    });

    this.socket.on("update users", data => {
      try {
        this.on_update_users(
          Object.entries(data).map(([k, v]) => new User(decode(v.nick), decode(v.color), decode(v.style), v.home))
        );
      } catch (err) {
        this.on_error(err);
      }
    });
  }

  update_user(new_user) {
    if (new_user instanceof User) {
      this.socket.emit("user joined", new_user.nick, new_user.color, new_user.style, new_user.home);
      this.user = new_user;
    } else if (typeof new_user === "string") {
      this.socket.emit("user joined", new_user, this.user.color, this.user.style, this.user.home);
      this.user.nick = new_user;
    }
  }

  connect() {
    this.socket.emit("user joined", this.user.nick, this.user.color, this.user.style, this.user.home);
  }

  send(message) {
    if (message instanceof Message) {
      this.socket.emit("message", message.content);
    } else if (typeof message === "string") {
      this.socket.emit("message", message);
    }
  }
}

module.exports = { Trollbox, User, Message }
