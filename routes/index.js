const express = require('express');
const moment = require('moment');
const striptags = require('striptags');
const nodemailer = require('nodemailer');
const csrf = require('csurf');
const firebaseAdminDb = require('../connections/firebase_admin');
const convertPagination = require('../modules/convertPagination');

const router = express.Router();
const categoriesRef = firebaseAdminDb.ref('/categories');
const articlesRef = firebaseAdminDb.ref('/articles');

const csrfProtection = csrf({
  cookie: true
});

/* GET home page. */
router.get('/', (req, res) => {
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  let categories = {};
  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    return articlesRef.orderByChild('up_time').once('value');
  }).then((snapshot) => {
    const articles = [];
    snapshot.forEach((snapshotChild) => {
      if ('public' === snapshotChild.val().status) {
        articles.push(snapshotChild.val());
      }
    });
    articles.reverse();
    const data = convertPagination(articles, currentPage);
    res.render('index', {
      articles: data.data,
      categoryId: null,
      page: data.page,
      categories,
      striptags,
      moment,
    });
  });
});

router.get('/archives/:category', (req, res) => {
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  const categoryPath = req.param('category');
  let categories = {};
  let categoryId = '';
  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.val().path === categoryPath) {
        categoryId = childSnapshot.val().id;
      }
    });
    return articlesRef.orderByChild('up_time').once('value');
  }).then((snapshot) => {
    const articles = [];
    snapshot.forEach((snapshotChild) => {
      if ('public' === snapshotChild.val().status && categoryId === snapshotChild.val().category) {
        articles.push(snapshotChild.val());
      }
    });
    articles.reverse();
    const data = convertPagination(articles, currentPage);
    res.render('index', {
      articles: data.data,
      page: data.page,
      categoryId,
      categories,
      striptags,
      moment,
    });
  });
});

router.get('/post/:id', (req, res) => {
  const id = req.param('id');
  let categories = {};
  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
  }).then((snapshot) => {
    const article = snapshot.val();
    if (!article) {
      return res.render('error', {
        title: '找不到該文章～ :('
      })
    }
    res.render('post', {
      article,
      categoryId: null,
      categories,
      moment,
    });
  });
});

router.get('/contact', csrfProtection, (req, res) => {
  const messages = req.flash('info');
  res.render('contact', {
    csrfToken: req.csrfToken(),
    messages,
    hasInfo: messages.length > 0
  })
})

router.post('/contact/send', csrfProtection, (req, res) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    from: `${req.body.username}`,
    to: process.env.EMAIL_USER,
    subject: req.body.emailTitle,
    text: `回覆信箱： ${req.body.email}\r\r${req.body.inputText}`
  }
  transporter.sendMail(mailOptions, (error, success) => {
    req.flash('info', '訊息已送出');
    res.redirect('/contact');
  })
})

module.exports = router;