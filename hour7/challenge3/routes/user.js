
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.user = function(req, res){
  var users = {
    1 : {
      first_name: 'Keyser',
      surname: "Soze",
      address: "Next door"
    },
    2 : {
      first_name: 'Bob',
      surname: "Holness",
      address: "Sheffield, UK"
    }    
  }
  res.render("user.jade",{user : users[req.params.id], title: 'User Info', id: req.params.id})
}