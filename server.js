const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config({ path: 'sample.env' })
const mongoose = require("mongoose");;
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const shortid = require('shortid');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var userSchema = new mongoose.Schema({
  username: String,
  _id: String,
  excersize: [{
    description: String,
    duration: Number,
    date: String
  }]
});

var User = mongoose.model("User", userSchema);

app.post(
  '/api/exercise/new-user',
  async function (req, res) {
    var { username } = req.body;
    const usernameExists = await User.find({ username: username });
    if (usernameExists.length > 0) {
      res.json({error: "Username already exists"});
      return;
    }
    var id = shortid.generate();

    let data = new User({
      username: username,
      _id: id
    });

    data.save(err => {
      if(err) {
        res.json({error: "try again"});
        return;
      };
    });

  res.json({
    username: username,
    _id: id
  });
  }
);

app.post(
  '/api/exercise/add',
  (req, res) => {
    var userId = req.body.userId.toString();
    var description = req.body.description;
    var duration = parseInt(req.body.duration);
    var date = req.body.date;

    if (date === '') {
      date = new Date();
    } else {
      date = new Date(date);
    }

    let data = {
      description: description,
      duration: duration,
      date: date
    };

    User.findById({ _id: userId }, (err, user) => {
      if(err) return console.log(err);
      user.excersize.push(data);
      user.save((err) => {
        if(err) return console.log(err);
        res.json({
          _id: userId,
          username: user.username,
          date: date.toString().substr(0,15),
          duration: duration,
          description: description
        });
      })
    });
  }
);

app.get(
  '/api/exercise/users',
  async function (req, res) {
    var users = await User.find();
    res.json(users);
  }
);

app.get(
  '/api/exercise/log',
  (req, res) => {
    var userId = req.query.userId;
    var limit = req.query.limit;
    console.log(userId,req.query.to,req.query.from,req.query.limit);

    const loggedUser = User.findById({ _id: userId }, (err, user) => {
      let log = [];
     
      user.excersize.forEach((obj) => {
        var dateFrom = new Date(0);
        var dateTo = new Date()
        if(req.query.from || req.query.to) {

          if(req.query.from) {
            dateFrom = new Date(req.query.from);
          }

          if(req.query.to) {
            dateTo = new Date(req.query.to);
          }
        }

        if(new Date(obj.date) <= dateTo && new Date(obj.date) >= dateFrom) {
          log.push({
            description: obj.description,
            duration: obj.duration,
            date: obj.date.toString().substr(0,15)
          });
        }
      });

      if(req.query.limit) {
        log = log.slice(0,req.query.limit);
      };

      res.json({
        _id: userId,
        username: user.username,
        count: log.length,
        log: log
      });
    })
  }
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
