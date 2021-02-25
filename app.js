const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');

const index = require('./routes/index');
const dashboard = require('./routes/dashboard');
const auth = require('./routes/auth');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('express-ejs-extend'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600 * 1000
  }
}));
app.use(flash());

const authChecker = (req, res, next) => {
  if (req.session.uid === process.env.ADMIN_UID || req.session.uid === process.env.TEST_UID) {
    return next();
  }
  return res.redirect('/auth/signin');
}

app.use('/', index);
app.use('/dashboard', authChecker, dashboard);
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  res.render('error', {
    title: '您所查看的頁面不存在～ :('
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.render('error', {
    title: '伺服器出現錯誤，請過一段時間再來～'
  });
});

module.exports = app;