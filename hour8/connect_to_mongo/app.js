
/**
 * Module dependencies.
 */

var express = require('express')
  , flash = require('connect-flash')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/todo_development', function(err) {
  if (!err) {
    console.log("Connected to MongoDB");
  } else {
    throw err;
  }
});
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Task = mongoose.model('Task', new Schema({task: String}))

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('TestSecret'));
  app.use(express.session({cookie: {maxAge: 60000}}));
  app.use(flash());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/tasks', function(req, res) {
  var flash = req.flash()
  console.log("req.flash", flash)

  Task.find({}, function(err, docs) {
    res.render('tasks/index',{title:"Your todos", docs:docs, flash: flash})    
  });
});

app.get('/tasks/new', function(req, res) {
  res.render('tasks/new', {title: "New Task"})
});

app.post('/tasks/new', function(req, res) {
  var task = new Task(req.body.task);
  task.save(function(err) {
    if (!err) {
      req.flash('info','Task created succesfully')
      res.redirect('/tasks');
    }
    else {
      //req.flash('warning', err);
      res.render('tasks/new', {title: "New Task",error:err})
    }
  });
});
app.get('/tasks/:id/edit', function(req, res) {
  Task.findById(req.params.id, function(err, doc) {
    if (doc) {
      res.render('tasks/edit', {
        title: 'Edit Task View',
        task: doc
      });      
    } else {
      //req.flash('warning', "Could not find a task with an id of " + req.params.id);
      res.redirect('/tasks');
    }
  });
});
app.put('/tasks/:id', function(req, res) {
  Task.findById(req.params.id, function(err, doc){
    doc.task = req.body.task.task;
    doc.save(function(err) {
      if (!err) {
        req.flash("info","Changes saved")
        res.redirect('/tasks');
      } else {
        //req.flash('warning', err);
      }
    });
  });
});
app.del('/tasks/:id', function(req, res, next) {
  Task.findById(req.params.id, function(err, doc){
    if (!doc) {
      return next(new NotFound('Task not found'));
    }
    doc.remove(function() {
      req.flash("info","Task deleted succesfully")
      res.redirect('/tasks')
    });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});