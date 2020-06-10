# TB93
## Examples
```js
const tb = require("tb93");

let bot = new tb.Trollbox(new tb.User("Example Bot", "green"));

bot.on_message = msg => {
  console.log(msg, msg.user);
  if (msg.user == "jankenpopp") {
    console.log(msg.user.home);
    throw "Oh no, it's Jankenpopp!";
  }
};

bot.on_error = err => { bot.send("Error:\n" + err.toString()) }

bot.connect();
```
