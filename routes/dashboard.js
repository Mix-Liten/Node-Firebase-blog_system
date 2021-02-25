const express = require('express');
const router = express.Router();
const striptags = require('striptags');
const moment = require('moment');
const convertPagination = require('../modules/convertPagination');
const firebaseAdminDb = require('../connections/firebase_admin');

const categoriesRef = firebaseAdminDb.ref('/categories');
const articlesRef = firebaseAdminDb.ref('/articles');
const tagsRef = firebaseAdminDb.ref('/tags');

router.get('/', (req, res) => {
    const messages = req.flash('info');
    res.render('dashboard/index', {
        title: 'Express',
        currentPath: '/',
        hasInfo: messages.length > 0
    });
});

router.get('/tags', (req, res) => {
    res.render('dashboard/tags', {
        title: 'Express'
    });
});

router.get('/api/tags', (req, res) => {
    tagsRef.once('value').then((snapshot) => {
        const tags = snapshot.val();
        res.send({
            success: true,
            data: tags,
        });
        res.end();
    });
});

router.get('/archives/', (req, res) => {
    const currentPage = Number.parseInt(req.query.page, 10) || 1;
    const status = req.query.status || 'public';
    let categories = {};
    categoriesRef.once('value').then((snapshot) => {
        categories = snapshot.val();
        return articlesRef.orderByChild('up_time').once('value');
    }).then((snapshot) => {
        const articles = [];
        snapshot.forEach((snapshotChild) => {
            if (status === snapshotChild.val().status) {
                articles.push(snapshotChild.val());
            }
        });
        articles.reverse();
        const data = convertPagination(articles, currentPage, `dashboard/archives?status=${status}`);
        res.render('dashboard/archives', {
            articles,
            categories,
            striptags,
            moment,
            status,
            currentPath: '/archives/',
            articles: data.data,
            page: data.page,
        });
    });
});

router.get('/article/create', (req, res) => {
    categoriesRef.once('value').then((snapshot) => {
        const categories = snapshot.val();
        res.render('dashboard/article', {
            categories,
            currentPath: '/article/create'
        });
    });
});

router.get('/article/:id', (req, res) => {
    const id = req.param('id');
    let categories = {};
    categoriesRef.once('value').then((snapshot) => {
        categories = snapshot.val();
        return articlesRef.child(id).once('value');
    }).then((snapshot) => {
        const article = snapshot.val();
        res.render('dashboard/article', {
            categories,
            article,
            currentPath: '/article/',
        });
    });
});

router.get('/categories', (req, res) => {
    const messages = req.flash('info');
    categoriesRef.once('value').then((snapshot) => {
        const categories = snapshot.val();
        res.render('dashboard/categories', {
            categories,
            currentPath: '/categories/',
            messages,
            hasInfo: messages.length > 0
        });
    });
});

// === 分類管理 ===
// 新增分類
router.post('/categories/create', (req, res) => {
    const categoryRef = categoriesRef.push();
    const key = categoryRef.key;
    const data = req.body;
    data.id = key;
    categoriesRef.orderByChild('path').equalTo(data.path).once('value').then((snapshot) => {
        if (snapshot.val() !== null) {
            req.flash('info', '已有相同的路徑');
            res.redirect('/dashboard/categories');
        } else {
            categoryRef.set(data).then(() => {
                res.redirect('/dashboard/categories');
            });
        }
    });
});

//刪除分類
router.post('/categories/delete/:id', (req, res) => {
    const id = req.param('id');
    categoriesRef.child(id).remove();
    req.flash('info', '欄位已刪除');
    res.redirect('/dashboard/categories');
    res.end();
});

// === 文章管理 ===
//新增文章
router.post('/article/create', (req, res) => {
    const articleRef = articlesRef.push();
    const key = articleRef.key;
    const upTime = Math.floor(Date.now() / 1000);
    const data = req.body;
    data.id = key;
    data.up_time = upTime;
    data.update_time = '';
    articleRef.set(data).then(() => {
        res.redirect(`/dashboard/article/${key}`);
    });
})

//更新文章
router.post('/article/update/:id', (req, res) => {
    const id = req.param('id');
    const updateTime = Math.floor(Date.now() / 1000);
    const data = req.body;
    data.id = id;
    console.log(data);
    data.update_time = updateTime;
    articlesRef.child(id).update(data).then(() => {
        res.redirect(`/dashboard/article/${data.id}`);
    });
})

//刪除文章
router.post('/article/delete/:id', (req, res) => {
    const id = req.param('id');
    articlesRef.child(id).remove().then(() => {
        req.flash('info', '文章已刪除');
        res.send('文章已刪除')
        res.end();
    });
});

// === 標籤管理 ===
// 新增
router.post('/api/tag/create', (req, res) => {
    const tagRef = tagsRef.push();
    // const key = tagRef.key;
    const data = req.body;
    tagsRef.orderByChild('name').equalTo(data.name).once('value')
        .then((snapshot) => {
            if (snapshot.val() !== null) {
                res.send({
                    success: false,
                    message: '已有相同的值',
                });
                res.end();
            } else {
                // 如果沒有這個值，才能技術儲存
                tagRef.set(data).then((response) => {
                    res.send({
                        success: true,
                        data: response,
                    });
                    res.end();
                });
            }
        });
});

module.exports = router;