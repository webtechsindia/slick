
function JSDateToExcelDate(inDate) {

var returnDateTime = 25569.0 + ((inDate.getTime() - (inDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
return returnDateTime.toString().substr(0,20);

}


define(function () {
    return {
        getColumns: function () { return columns; }
    };




});