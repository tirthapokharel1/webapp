var express = require('express');
var path = require('path'); 
var fs = require('fs'); 
var app = express();
var mongo = require('mongodb');
var new_db = "mongodb://tirtha:123456789@ds163053.mlab.com:63053/testform";
var bodyParser = require('body-parser');
var crypto = require('crypto');
//Creating the database

app.get('/',function(req,res){
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/signup.html');
}).listen(3000);

app.get('/login', function(req, res) {
			res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/login.html');
});

console.log("Server listening at : 3000");
app.use('/public', express.static(__dirname + '/public'));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

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
	var name = req.body.name;
	var email= req.body.email;
	var pass = req.body.password;
		var phone = req.body.phone;
	var password = getHash( pass , phone ); 				

	
	var data = {
		"name":name,
		"email":email,
		"password": password, 
		"phone" : phone
	}
	
	mongo.connect(new_db , function(error , db){
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
	return res.redirect('/public/success.html'); 
	
app.post('/login',function(req,res){
	db.collection("users").findOne({"email":req.body.email && "password":req.body.password},(err,result) =>{
		if(err) throw err;
		if(err !==null){
			console.log('login success');
		}
		
	})
	// console.log('login success');
})
return res.redirect('/public/profile.html');

});