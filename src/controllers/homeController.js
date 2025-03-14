// src/controllers/homeController.js
const getHomePage = (req, res) => {
    res.render('landing-page', { message: 'Welcome to HUSTHUB!' });
   };
 
  
 
 module.exports = { getHomePage };
   