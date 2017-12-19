/*
Module Dependencies 
*/
var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    hash = require('./pass').hash;

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var crypto = require('crypto');
var mongo = require('mongodb');
var new_db = "mongodb://tirtha:123456789@ds163053.mlab.com:63053/testform";


var app = express();

/*
Database and Models
*/
mongoose.connect("mongodb://tirtha:123456789@ds163053.mlab.com:63053/testform");
var UserSchema = new mongoose.Schema({
    username: String,
    email:String,
    password: String,
    phone:String,
    salt: String,
    hash: String
});

var User = mongoose.model('users', UserSchema);
/*
Middlewares and configurations 
*/

    app.use(bodyParser.urlencoded({ extended: false }))
 
    // parse application/json
    app.use(bodyParser.json())
    app.use(cookieParser());
    app.use(session({secret: 'keyboard cat'}));
    app.use(express.static(path.join(__dirname, 'public')));
    // app.set('views', __dirname + '/views');
    // app.set('view engine', 'jade');


app.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});
/*
Helper Functions
*/
function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);

    User.findOne({
        username: name
    },

    function (err, user) {
        if (user) {
            if (err) return fn(new Error('cannot find user'));
            hash(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('invalid password'));
            });
        } else {
            return fn(new Error('cannot find user'));
        }
    });

}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = "User Exist"
            res.redirect("/signup");
        }
    });
}

/*
Routes
*/
// app.get("/", function (req, res) {

//     if (req.session.user) {
//         res.send("Welcome " + req.session.user.username + "<br>" + "<a href='/logout'>logout</a>");
//     } else {
//         res.send("<a href='/login'> Login</a>" + "<br>" + "<a href='/signup'> Sign Up</a>");
//     }
// });

app.get('/',function(req,res){
    res.set({
        'Access-Control-Allow-Origin' : '*'
    });
    return res.redirect('/signup.html');
})

app.get('/login', function(req, res) {
            res.set({
        'Access-Control-Allow-Origin' : '*'
    });
    return res.redirect('/login.html');
});

// app.get("/signup", function (req, res) {
//     if (req.session.user) {
//         res.redirect("/");
//     } else {
//         res.render("signup");
//     }
// });

// app.post("/signup", userExist, function (req, res) {
//     var password = req.body.password;
//     var username = req.body.username;

//     hash(password, function (err, salt, hash) {
//         if (err) throw err;
//         var user = new User({
//             username: username,
//             salt: salt,
//             hash: hash,
//         }).save(function (err, newUser) {
//             if (err) throw err;
//             authenticate(newUser.username, password, function(err, user){
//                 if(user){
//                     req.session.regenerate(function(){
//                         req.session.user = user;
//                         req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
//                         res.redirect('/');
//                     });
//                 }
//             });
//         });
//     });
// });

var getHash = ( pass , phone ) => {
                
                var hmac = crypto.createHmac('sha512', phone);
                
                //passing the data to be hashed
                data = hmac.update(pass);
                //Creating the hmac in the required format
                gen_hmac= data.digest('hex');
                //Printing the output on the console
                console.log("hmac : " + gen_hmac);
                return gen_hmac;
}

// Sign-up function starts here. . .
app.post('/sign_up' ,function(req,res){
    var username = req.body.username;
    var email= req.body.email;
    var pass = req.body.password;
        var phone = req.body.phone;
    var password = getHash( pass , phone );                 

    
    var data = {
        "username":username,
        "email":email,
        "password": password, 
        "phone" : phone
    }
    
    mongoose.connect(new_db , function(error , db){
        if (error){
            throw error;
        }
        console.log("connected to database successfully");
        //CREATING A COLLECTION IN MONGODB USING NODE.JS
        db.collection("users").insertOne(data, (err , collection) => {
            if(err) throw err;
            console.log("Record inserted successfully");
            console.log(collection);
        });
    });
    
    console.log("DATA is " + JSON.stringify(data) );
    res.set({
        'Access-Control-Allow-Origin' : '*'
    });
    return res.redirect('/success.html'); 
});


// app.get("/login", function (req, res) {
//     res.render("login");
// });

app.post("/login", function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {

            req.session.regenerate(function () {

                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                res.redirect('/');
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            res.redirect('/login');
        }
    });
});

// app.get('/logout', function (req, res) {
//     req.session.destroy(function () {
//         res.redirect('/');
//     });
// });

// app.get('/profile', requiredAuthentication, function (req, res) {
//     res.send('Profile page of '+ req.session.user.username +'<br>'+' click to <a href="/logout">logout</a>');
// });


http.createServer(app).listen(3000);