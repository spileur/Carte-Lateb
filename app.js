const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const sharp = require('sharp');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

/**
 * Definition of Database
 */

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});
module.exports = sequelize;
const Beer = require('./tables/beer');
/**
 * Basic Get query
 */

app.get('/', async (req, res) => {
  const beersRequest = await Beer.findAll({where: {deleted: false}, order: [['arrivage', 'DESC'], ['type', 'ASC']], raw: true});
  const beers = {};
  beersRequest.forEach(beer => {
    if(new Date(beer.arrivage).getTime() <= Date.now()) {
      if(!beers[beer.arrivage]) {
        beers[beer.arrivage] = new Array();
      }
      beers[beer.arrivage].push(beer);
    }
  });
  res.render('index', {user: req.session.user, beers: beers});
});


app.get('/login', (req, res) => {
  if(req?.session?.user)
    return res.redirect('/admin');
  res.render('login');
});

app.post('/login', (req, res) => {
  if(req?.session?.user)
    return res.redirect('/admin');
  if(req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.user = { username: 'admin' };
    res.redirect('/admin');
  } else {
    res.render('login', { error: "Mot de passe incorrect" });
  }
});

// ADMIN

app.get('/admin', async (req, res) => {
  if(checkAuth(req, res)) {
    try {
      const beers = await Beer.findAll({where: {deleted: false}, order:  [['arrivage', 'DESC'], ['type', 'ASC']]});
      const old = await Beer.findAll({where: {deleted: true}, order: [['brasserie', 'ASC'], ['nom', 'ASC']]});
      res.render('admin', {beers: beers, old: old});
    } catch (error) {
      res.status(500);
    }
    
  }
});

app.get("/admin/delete/:id", async (req, res) => {
  if(checkAuth(req, res)) {
    if(req.params.id) {
      const beer = await Beer.findByPk(req.params.id);
      if(beer) {
        beer.deleted = true;
        await beer.save();
      }
    }
  }
  res.redirect('/admin');
});

app.get("/admin/force-delete/:id", async (req, res) => {
  if(checkAuth(req, res)) {
    if(req.params.id) {
      const beer = await Beer.findByPk(req.params.id);
      if(beer) {
        await beer.destroy();
      }
    }
  }
  res.redirect('/admin');
});

app.post("/admin/add", async (req, res) => {

  if(checkAuth(req, res)) {
    if(req.body.nom && req.body.brasserie && req.body.type && req.body.arrivage) {
      let image = null;
      if(req.files?.image) {
        image = await sharp(req.files.image.data)
                          .resize(200, 200)
                          .toBuffer();
      }
      Beer.create({
        nom: req.body.nom,
        brasserie: req.body.brasserie,
        type: req.body.type,
        tauxAlcool: req.body.tauxAlcool ?? null,
        taille: req.body.taille ?? null,
        description: req.body.description,
        arrivage: Date.parse(req.body.arrivage),
        badge: req.body.badge ?? null,
        image: image?.toString('base64') ?? null
      });
    } else {
      res.status(400).send("Missing arguments in body")
    }
  }
  res.redirect('/admin');
});

app.post("/admin/edit/:id", async (req, res) => {
  if(checkAuth(req, res)) {
    if(req.params.id) {
      const beer = await Beer.findByPk(req.params.id);
      if(beer) {
        beer.nom = req.body.nom;
        beer.brasserie = req.body.brasserie;
        beer.type = req.body.type;
        beer.tauxAlcool = req.body.tauxAlcool;
        beer.taille = req.body.taille;
        beer.description = req.body.description;
        beer.commentaire = req.body.commentaire;
        beer.arrivage = req.body.arrivage;
        beer.badge = req.body.badge;
        beer.deleted = false;
        if(req.files?.image) {
          const image = await sharp(req.files.image.data)
                          .resize(200, 200)
                          .toBuffer();
          beer.image = image?.toString('base64') ?? null;
        }
        await beer.save();
      }
    }
  }
  res.redirect('/admin');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

function checkAuth(req, res){
  if(req?.session?.user?.username === 'admin') {
    return true;
  } else {
    res.redirect('/login');
    return false;
  }
}

app.listen(PORT, 'localhost', () => {
  console.log(`Server is running on port ${PORT}`);
});
