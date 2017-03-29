require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const knexSettings = require('./knexfile');
const knexLogger = require('knex-logger');
const knex = require('knex')(knexSettings[process.env.NODE_ENV || 'development']);

const app = express();

app.set('view engine', 'ejs');

if (process.env.NODE_ENV === 'development') {
  app.use(knexLogger(knex));
}

app.use(express.static('public'));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'development']
}));

app.use(flash());

app.get('/', (req, res) => {
  if (req.session.user_id) {
    let bundleSrc;
    if (process.env.NODE_ENV === 'production') {
      bundleSrc = '/bundle.js';
    } else {
      bundleSrc = 'http://localhost:8081/bundle.js';
    }
    res.render('app', {
      bundleSrc: bundleSrc
    });
  } else {
    res.render('index', {
      errors: req.flash('errors'),
      info: req.flash('info')
    });
  }
});

app.post('/login', (req, res) => {
  knex('users').select('id', 'password_digest').where({email: req.body.email}).limit(1).then(rows => {
    const user = rows[0];
    if (!user) {
      return Promise.reject({message: 'bad credentials'});
    }
    return bcrypt.compare(req.body.password, user.password_digest).then(passwordsMatch => {
      if (!passwordsMatch) {
        return Promise.reject({message: 'bad credentials'});
      }
      return Promise.resolve(user);
    });
  }).then(user => {
    req.session.user_id = user.id;
    res.redirect('/');
  }).catch(err => {
    req.flash('errors', err.message || 'there was an error while logging you in');
    res.redirect('/');
  });
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    req.flash('error', 'email and password are required');
    res.redirect('/');
    return;
  }
  knex('users').select(1).where({email: req.body.email}).then(rows => {
    if (rows.length) {
      return Promise.reject({message: 'email already has an account'});
    }
    return bcrypt.hash(req.body.password, 10);
  }).then(passwordDigest => {
    return knex('users').insert({
      email: req.body.email,
      password_digest: passwordDigest
    });
  }).then(() => {
    req.flash('info', 'account successfully created');
    res.redirect('/');
  }).catch(err => {
    req.flash('errors', err.message || 'there was an error while creating your account');
    res.redirect('/');
  });
});

app.get('/profile', (req, res) => {
  if (!req.session.user_id) {
    res.status(401);
    res.json({error: 'you must be signed in to reach this route'});
    return;
  }
  knex('users').select('email').where({id: req.session.user_id}).limit(1).then(rows => {
    res.json(rows[0]);
  }).catch(err => {
    res.status(500);
    res.json({
      error: err.message || 'something went wrong while fetching your profile'
    });
  });
});

app.put('/profile', (req, res) => {
  const promises = [];
  if (req.body.email) {
    promises.push(knex('users').select(1).where({email: req.body.email}).andWhereNot({id: req.session.user_id}).then(rows => {
      if (rows.length) {
        return Promise.reject({message: 'email already has an account'});
      }
      return true;
    }));
  } else {
    promises.push(Promise.resolve(false));
  }
  if (req.body.password) {
    promises.push(bcrypt.hash(req.body.password, 10));
  } else {
    promises.push(Promise.resolve(false));
  }
  Promise.all(promises).then(values => {
    const user = {};
    if (values[0]) {
      user.email = req.body.email;
    }
    if (values[1]) {
      user.password_digest = values[1];
    }
    return knex('users').update(user).where({id: req.session.user_id});
  }).then(() => {
    res.json({message: 'account successfully updated'});
  }).catch(err => {
    res.status(500);
    res.json({
      error: err.message || 'something went wrong while updating your profile'
    });
  });
});

const server = app.listen(process.env.PORT || 8080, () => {
  const address = server.address();
  console.log('Server listening on port', address.port);
});
