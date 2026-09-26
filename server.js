require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

require('./db'); // initialise la base au demarrage

const app = express();
app.set('trust proxy', 1); // necessaire derriere le proxy HTTPS de Railway/Render pour detecter req.protocol correctement

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-de-developpement-a-changer',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
    secure: process.env.NODE_ENV === 'production',
  },
}));

// Variables disponibles dans toutes les vues
app.use((req, res, next) => {
  res.locals.brandName = process.env.BRAND_NAME || 'Boutika';
  res.locals.contactWhatsapp = process.env.CONTACT_WHATSAPP || '';
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.get('/', (req, res) => {
  res.render('landing');
});

app.use(require('./routes/auth'));
app.use(require('./routes/dashboard'));
app.use(require('./routes/public'));
app.use(require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('404');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${process.env.BRAND_NAME || 'Boutika'} est lance sur le port ${PORT}`);
});
