
var dataPage = 'woFilterAllCopy';
//var siteURL='/Kund/Bridge/workorder.nsf' + '/' + dataPage;
var siteURL='/Kund/Bridge/workorder.nsf' + '/' + dataPage;

var dataView;
var grid;
var data = [];
var i = 0;
var row = 0;
var columns = [];
var ajax = 0;
var options = {
    enableCellNavigation: true,
    showHeaderRow: true,
    headerRowHeight: 30,
    explicitInitialization: true
  };
var searchString = "";
var sortcol = "title";
var sortdir = 1;
var percentCompleteThreshold = 0;
var searchString = "";
var queued  = [];
var loopcount = 0;
var primeWorker = new Worker('worker.js');
var columnFilters = {};

function percentCompleteSort(a, b) {
  return a["percentComplete"] - b["percentComplete"];
}

function comparer(a, b) {
  var x = a[sortcol], y = b[sortcol];
  return (x == y ? 0 : (x > y ? 1 : -1));
}

function getcolumn(){
  return $.ajax({
  type: "GET",
  //url: siteURL + "?readdesign&outputformat=json",
  url:'latestviewcolums.json',
  dataType:'json'
    });
}

function filter(item,args) {
for (var columnId in columnFilters) {
      if (columnId !== undefined && columnFilters[columnId] !== "") {
        var c = grid.getColumns()[grid.getColumnIndex(columnId)];
        if (item[c.field].indexOf(columnFilters[columnId]) == -1) {
          return false;
        }
      }
    }
    return true;
  }
function toggleFilterRow() {
  grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
}

function ordercolumns(unsortedcolumn){
  var items = [];
  var cols = unsortedcolumn['column'];
  columns = [];
  cols.forEach( function(col){  
          columns.push(
                        {
                            id: col['@columnnumber'], 
                            name:col['@title'], 
                            field: col['@name'],
                            cssClass: "cell-selection", 
                            width: col['@width']*3,
                             cannotTriggerInsert: true, 
                             resizable: false,
                              selectable: true 
                          }
            );
         });
    return columns;
}

function formatDate(date){
  datearray   = date.split(',');
  dateandtime = datearray[0].split('T');
  year        = dateandtime[0].substring(0, 4);
  month       = parseInt(dateandtime[0].substring(4, 6)) - 1; 
  day         = dateandtime[0].substring(6, 8); 
  hour        = dateandtime[1].substring(0, 2); 
  minute      = dateandtime[1].substring(2, 4); 
  sec         = dateandtime[1].substring(4, 6); 
  var date = new Date(Date.UTC(year, month,day, hour, minute, sec));
  return date.toLocaleString();
}

function getNewrows(startfrom, count){
if(typeof(Worker) !== "undefined") {
   primeWorker.postMessage([startfrom,count]);
   primeWorker.onmessage = function(element) {
      var here = element.data;
       if(here['viewentry']!=="undefined"){
              if(typeof queued[loopcount]!=='undefined'){
                  getNewrows(queued[loopcount][0],queued[loopcount][1]);
                  loopcount++;
                  arrageData(here['viewentry']);
                  
                 }else{
                  grid.init();
                  dataView.beginUpdate();
                  dataView.setItems(data);
                  dataView.setFilter(filter);
                  dataView.endUpdate();
                 }
              }
    };
}else {
    ajax++;
    $.ajax({
      type: "GET",
    //  url: siteURL + "?readviewentries&outputformat=json",
    data : { start : startfrom, count : count },
      url: 'latestviewentries.json',
       dataType:'json',
       success:function(newdata){
              if(queued[loopcount]){
                getNewrows(queued[loopcount][0],queued[loopcount][1]);
                loopcount++;
                arrageData(newdata['viewentry']);
                grid.setData(data);
                grid.render();
                }
            }
    });
  }
}




function getgriddata(){
  return $.ajax({
    type: "GET",
   // url: siteURL + "?readviewentries&outputformat=json&count=3000",
    url: 'latestviewentries.json',
     dataType:'json'
  });
}


function arrageData(unfromated){
   unfromated.forEach(function(rows){
             data[i] = {};
             row++;
       
            rows['entrydata'].forEach(function(cindcolum){
                if("text" in cindcolum){
                    data[i]['id']               =  cindcolum['@columnnumber']+row+" "+i;
                    data[i][cindcolum['@name']] =  cindcolum['text']['0'];
                }
                 else if("textlist" in cindcolum){
                    data[i]['id']               =  cindcolum['@columnnumber']+row+" "+i;
                    data[i][cindcolum['@name']] =  cindcolum['textlist']['text'][0];
                  }else if("number" in cindcolum){
                    data[i]['id']               =  cindcolum['@columnnumber']+row+" "+i;
                    data[i][cindcolum['@name']] =  cindcolum['number'][0];
                  }else if("datetime" in cindcolum){
                    data[i]['id']               =  cindcolum['@columnnumber']+row+" "+i;
                    var readableDate            =  formatDate(cindcolum['datetime'][0]);
                    data[i][cindcolum['@name']] =  readableDate;
                  }
              else{
                    alert('new format found!!! check console');
                    return false;
                 }
              
             });
             i++

           });
//var unfromated = undefined;
}

 function updateFilter() {
    dataView.setFilterArgs({
      searchString: searchString
    });
    dataView.refresh();
  }



$(function () {
    columnajax = getcolumn();
    columnajax.done(function (allcolumns) {
    columns =  ordercolumns(allcolumns);
    datapromise = getgriddata();
    datapromise.done(function(newdata){
    var toplevelentries = newdata['@toplevelentries'];
    var percount        = newdata['viewentry'].length;
    totalrequest = Math.ceil(toplevelentries/percount); 
        

    arrageData(newdata['viewentry']);

    dataView = new Slick.Data.DataView();
    grid = new Slick.Grid("#myGrid", dataView, columns, options);

    grid.onHeaderRowCellRendered.subscribe(function(e, args) {
        $(args.node).empty();
        $("<input type='text'>")
           .data("columnId", args.column.id)
           .val(columnFilters[args.column.id])
           .appendTo(args.node);
    });

  $("#txtSearch,#txtSearch2").keyup(function (e) {
    Slick.GlobalEditorLock.cancelCurrentEdit();

    // clear on Esc
    if (e.which == 27) {
      this.value = "";
    }
    searchString = this.value;
    updateFilter();
  });


 
    $(grid.getHeaderRow()).delegate(":input", "change keyup", function (e) {
      var columnId = $(this).data("columnId");
      if (columnId != null) {
        columnFilters[columnId] = $.trim($(this).val());
        dataView.refresh();
      }
    });      

     // move the filter panel defined in a hidden div into grid top panel
  $("#inlineFilterPanel")
      .appendTo(grid.getTopPanel())
      .show();

    dataView.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
         grid.invalidateRows(args.rows);
        grid.render();
      });
    dataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });
  
    //===========get other set of data's===================
     for(k=1;k<totalrequest;k++){ 
       if(k==1)
       var apirequest = getNewrows((k * percount) + 1, percount);
        else{
            start = (k * percount) + 1;
            queued.push([start,percount]);
        }
      }
   //    ============================== 
       
      grid.init();
      dataView.beginUpdate();
      dataView.setItems(data);
      dataView.setFilter(filter);
      dataView.endUpdate();

    })
  })

})