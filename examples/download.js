define(function () {
    return function (fileName, content) {
        var form = $("<form>").attr({
            target: '_BLANK',
            action: '/slick/examples/test.php',
            method: 'post'
        }).css({display: 'none'});
        form.append($("<input>").attr({name: 'fileName', value: fileName}));
        form.append($("<input>").attr({name: 'contentType', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
        form.append($("<textarea>").attr({name: 'content', value: content}));
        form.appendTo($("body"))
        form.submit();
        window.setTimeout(function () {form.remove();}, 10000);
    }
});
