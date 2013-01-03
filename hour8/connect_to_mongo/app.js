
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

function createTask(name, details) {
  var task = new Task({
    task : name,
    details : details
  });
  return task;
}

function validatePresenceOf(value) {
  return value && value.length
}

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var taskSchema = new Schema({
    task: {
      type: String,
      validate: [validatePresenceOf, "Please enter a task name"]
    },
    details: {
      type: String,
      validate: [validatePresenceOf, "Please enter some details"] 
    }
  }
)

var Task = mongoose.model('Task', taskSchema)
// var Task = mongoose.model('Task', new Schema({task: String}));
// Task.schema.path("task").required(true);

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
  Task.find({}, function(err, docs) {
    res.render('tasks/index',{title:"Your todos", docs:docs, flash: req.flash()})    
  });
});

app.get('/tasks/new', function(req, res) {
  var newTask = req.flash('newTask')[0] || createTask('', '');
  console.log("newTask:", newTask);
  var flash = req.flash();
  console.log("/tasks/new: Got flash:",flash)
  res.render('tasks/new', {title: "New Task", flash: flash, task: newTask})
});

app.post('/tasks', function(req, res) {
  var task = createTask(req.body.task.task, req.body.task.details);
  task.save(function(err) {
    console.log("In save: err:",err);
    if (!err) {
      req.flash('info','Task created succesfully')
      res.redirect('/tasks');
    }
    else {
      req.flash('warning', err);
      req.flash('newTask', task);
      res.redirect('/tasks/new');
    }
  });
});

app.get('/tasks/:id/edit', function(req, res) {
  var handleDoc = function(err, doc) {
    console.log("handleDoc: doc:", doc);
    if (doc) {
      res.render('tasks/edit', {
        title: 'Edit Task View',
        task: doc,
        flash: req.flash()
      });      
    } else {
      req.flash('warning', "Could not find a task with an id of " + req.params.id);
      res.redirect('/tasks');
    }    
  }

  var task = req.flash('editedTask')[0]
  
  if (task) {
    task = new Task(task);
    handleDoc(null, task);
  } else {
    Task.findById(req.params.id, function(err, doc) {
      handleDoc(err, doc);
    });
  }
});

app.put('/tasks/:id', function(req, res) {
  Task.findById(req.params.id, function(err, doc){
    doc.task = req.body.task.task;
    doc.details = req.body.task.details;
    doc.save(function(err) {
      if (!err) {
        req.flash("info","Changes saved")
        res.redirect('/tasks');
      } else {
        req.flash('warning', err);
        req.flash('editedTask', doc);
        res.redirect('/tasks/' + req.params.id + "/edit");
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
