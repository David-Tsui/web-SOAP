// Initialize Firebase
function MyFirebase(config) {
	console.log("config: ", config);
	firebase.initializeApp(config);
  this.firebase = firebase.database();
}

MyFirebase.prototype.writeUserData = function(userId, name, email) {	
	console.log("this: ", this);
	this.firebase.ref('users/' + userId).set({
	  username: name,
	  email: email
	});
}

MyFirebase.prototype.retriveUserData = function(userId) {	
	console.log("this: ", this);
	this.firebase.ref('users/' + userId).on('child_added', function(data) {
		console.log("data: ", data);
  	console.log("data: ", data.val());
  });
}


$(document).ready(function() {
	var config = {
	  apiKey: "AIzaSyDLww7OSWbGE3KyQgEd6kyaVl7Xsic6yIg",
	  authDomain: "soap-6e744.firebaseapp.com",
	  databaseURL: "https://soap-6e744.firebaseio.com",
	  storageBucket: "soap-6e744.appspot.com",
	};
	var db = new MyFirebase(config);
	console.log("db: ", db);

	$("#btn-save").click(function() {
		db.writeUserData(1, "David", "st880221@gmail.com");
	});

	$("#btn-retrieve").click(function() {
		db.retriveUserData(1);
	});
});