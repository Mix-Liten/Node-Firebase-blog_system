const express = require('express');
const firebaseClient = require('../connections/firebase_client');
const router = express.Router();

//登入
router.get('/signin', (req, res) => {
    const messages = req.flash('info');
    res.render('dashboard/signin', {
        messages,
        hasInfo: messages.length > 0,
        currentPath: '/auth/signin'
    });
});
//註冊
router.get('/signup', (req, res) => {
    const messages = req.flash('info');
    res.render('dashboard/signup', {
        messages,
        hasInfo: messages.length > 0,
        currentPath: '/auth/signup'
    });
});
//登出
router.get('/signout', (req, res) => {
    req.session.uid = '';
    res.redirect('/auth/signin');
});

router.post('/signup', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirm_password;
    if (password !== confirmPassword) {
        req.flash('info', '密碼驗證不通過');
        res.redirect('/auth/signup');
    } else {
        firebaseClient.auth().createUserWithEmailAndPassword(email, password).then(() => {
            req.flash('info', '註冊成功，立刻登入吧');
            res.redirect('/auth/signin');
        }).catch((error) => {
            req.flash('info', error.message);
            res.redirect('/auth/signup');
        })
    };
});

router.post('/signin', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    firebaseClient.auth().signInWithEmailAndPassword(email, password).then((user) => {
        req.session.uid = user.uid;
        req.session.mail = user.mail;
        res.redirect('/dashboard');
    }).catch((error) => {
        req.flash('info', error.message);
        res.redirect('/auth/signin');
    })
});

module.exports = router;