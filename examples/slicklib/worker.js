importScripts('http://cloud.github.com/downloads/kpozin/jquery-nodom/jquery.nodom.js');

function getNewrowsByWorker(startfrom){
$.ajax({
      type: "GET",
   //   url: siteURL + "?readviewentries&outputformat=json",
    data : { start : startfrom[0], count : startfrom[1]},
      url: '../fulljson.json',
       dataType:'json',
       success:function(newdata){
                postMessage(newdata);
            }
    });
}
this.onmessage  = function(event){
  getNewrowsByWorker(event.data);
}

