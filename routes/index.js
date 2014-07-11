
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', {
        title: 'ねぇねぇ、ちょっと聞いてよ＆聞かれてよ？',
        h1: 'Guess What!?',
        template_question: [
            '<p class="name"><%= name %></p>',
            '<p class="q" data-q="<%= q %>"<%if(from) {%> data-from="<%= from %>"<% } %>><%if(!hidden) {%><%= view_q %><% } else { %><a href="#open"><%= view_q %></a><% } %></p>',
            '<p class="time"><%= time %></p>',
        ].join('')
    });
};
