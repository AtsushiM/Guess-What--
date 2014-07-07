
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    socket = require('socket.io'),
    path = require('path'),
    mongoose = require('mongoose'),

    db = mongoose.connect('mongodb://localhost/guess_what'),
    QASchema = new mongoose.Schema({
        name: {
            type: String
        },
        q: {
            type: String
        },
        time: {
            type: Number
        }
    }),
    QA = db.model('qa', QASchema),
    app = express(),
    server = http.createServer(app),
    io = socket.listen(server);

io.enable('browser client minification');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);

server.listen(app.get('port'));

io.sockets.on('connection', function(socket) {
    var mineid = socket.id;

    QA.find({}).sort({time: -1}).limit(200).execFind(function(err, items) {
        if (err) {
            console.log(err);
        }

        items = items.reverse();

        socket.emit('initializequestion', items);
    });

    socket.on('sendquestion', function(data) {
        data.time = Date.now();

        var qa = new QA(data);

        qa.save(function(err) {
            if (err) {
                console.log(err);
                return;
            }

            // 保存しないデータ
            randsocket = randamSelect(socket.id, socket.namespace.sockets);

            data.from = socket.id;
            data.nothear = null;
            if (randsocket) {
                data.nothear = randsocket.id;
            }

            io.sockets.emit('recivequestion', data);
        });
    });
});

function randamSelect(myid, sockets) {
    var ary_sockets = [],
        i = 0,
        rand = 0;

    for (i in sockets) {
        if (i !== myid) {
            ary_sockets.push(sockets[i]);
        }
    }
    rand = Math.floor(Math.random() * ary_sockets.length);
    if (rand >= ary_sockets.length) {
        rand = ary_sockets.length - 1;
    }

    return ary_sockets[rand];
}
