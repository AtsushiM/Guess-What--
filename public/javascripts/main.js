var cssholicqachat = {
        validater: new C.Validate()
    };

cssholicqachat.socket = io.connect();
cssholicqachat.addQuestion = function(data) {
    cssholicqachat.collections.questions.add(
        new cssholicqachat.models.Question({
            defaults: data
        })
    );
};
cssholicqachat._dayConvertAry = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
];
cssholicqachat._formatNumDigit2 = function(num) {
    num = num * 1;

    if (num < 10) {
        num = '0' + num;
    }

    return '' + num;
};
cssholicqachat.formatDate = function(date) {
    var digit2 = cssholicqachat._formatNumDigit2,
        ymd = [
            date.getFullYear(),
            digit2(date.getMonth()),
            digit2(date.getDate())
        ],
        hms = [
            digit2(date.getHours()),
            digit2(date.getMinutes()),
            digit2(date.getSeconds())
        ];

    return ymd.join('/') +
        '(' +
            cssholicqachat._dayConvertAry[ date.getDay() ] +
        ')' +
        ' ' + hms.join(':');
};

cssholicqachat.collections = {
    questions: new C.Ollection()
};

cssholicqachat.models = {
    Question: C.Model.extend({
        defaults: {
            name: '',
            q: '',
            time: 0
        },
        validate: {
            name: cssholicqachat.validater.isString,
            q: cssholicqachat.validater.isString,
            time: cssholicqachat.validater.isNumber
        }
    })
};

// send
cssholicqachat.views = {
    sendBlock: new C.View({
        el: '#send',
        init: function() {
            this.username = this.el.find('.username input');
            this.question = this.el.find('.question input');
            this.lock();
        },
        events: {
            '&': {
                'submit': 'submit'
            }
        },
        getUserName: function() {
            return this.username.val() || 'No name';
        },
        lock: function() {
            this.el.css({
                opacity: '0.5'
            });
            this.isLock = true;
        },
        unlock: function() {
            this.el.css({
                opacity: '1'
            });
            this.isLock = false;
        },
        submit: function(e) {
            e.preventDefault();

            var name = this.getUserName(),
                q = this.question.val();

            if (this.isLock || !q) {
                return;
            }

            cssholicqachat.socket.emit('sendquestion', {
                name: name,
                q: q
            });

            this.question.val('');
            this.lock();
        }
    }),
    questions: new C.View({
        el: '#questions',
        template: C.$('#template-question').html(),
        collection: cssholicqachat.collections.questions,
        init: function() {
            var that = this;

            that.collection.on('change', that.render);

            cssholicqachat.socket.on('recivequestion', function(data) {
                cssholicqachat.addQuestion(data);
                cssholicqachat.views.sendBlock.unlock();
            });
        },
        events: {
            '.q a': {
                'click': 'qclick'
            }
        },
        qclick: function(e) {
            e.preventDefault();

            var $q = C.$(e.target).parent();

            $q.html('「"' + $q.attr('data-q') + '"と言ったんだ。」と教えてくれました。');

            cssholicqachat.socket.emit('rehearquestion', $q.attr('data-from'));
            cssholicqachat.socket.emit('rehearquestion', {
                from: $q.attr('data-from'),
                q: $q.attr('data-q'),
            });
        },
        clear: function() {
            this.el.html('');
        },
        render: function(data, index, collection) {
            data = data.get();

            data.time = cssholicqachat.formatDate(new Date(data.time));

            data.view_q = data.q;
            data.hidden = false;
            if (data.nothear === cssholicqachat.socket['socket']['sessionid']) {
                data.view_q = 'この発言はよく聞こえなかった！聞き返したい？';
                data.hidden = true;
            }

            if (!data.name) {
                data.name = cssholicqachat.views.sendBlock.getUserName();
            }

            if (!data.from) {
                data.from = '';
            }

            var html = C.template(this.template, data),
                li = C.dom.create('li');

            C.dom.html(li, html);

            this.el.insertBefore(li);

            // 描画が切り替わる毎に動作を設定
            this.reattach();
        }
    })
};

cssholicqachat.socket.on('initializequestion', function(datas) {
    var i = 0,
        len = datas.length;

    cssholicqachat.views.questions.clear();

    for (; i < len; i++) {
        cssholicqachat.addQuestion(datas[i]);
    }

    cssholicqachat.views.sendBlock.unlock();
});

// title styling
(function() {
    var $h1 = C.$('h1'),
        h1_text = C.util.unescape($h1.html()),
        $span,
        i;

    $h1.html(
        '<span>' + h1_text.split('').join('</span><span>') + '</span>'
    );

    $span = $h1.find('span');

    i = $span.length;
    for (; i--;) {
        C.dom.addClass($span[i], 'letter' + i);
    }
}());
