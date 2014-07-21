function openGoogleMap(options) {
	// modified to handle encoded values by checking for indexOf('%')
	var strFeatures='toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes'
	strFeatures+=', width=1000, height=760';
	var args=(typeof options.docid==='undefined' || options.docid==='') ? '' : '&docunid='+ ((options.docid.indexOf('%')>-1) ? options.docid : encodeURI(options.docid));
	args+=(typeof options.view==='undefined' || options.view==='') ? '' : '&view='+ ((options.view.indexOf('%')>-1) ? options.view : encodeURI(options.view));
	args+=(typeof options.category==='undefined' || options.category==='') ? '' : '&category='+ ((options.category.indexOf('%')>-1) ? options.category : encodeURI(options.category));
	args+=(typeof options.query==='undefined' || options.query==='') ? '' : '&query='+ ((options.query.indexOf('%')>-1) ? options.query : encodeURI(options.query));
	
	if (typeof options.docids!=='undefined' && options.docids.length>0) {
		//alert(options.docids.toString());
		setIDsArray(options.docids);
		args+='&getidscallback=getIdsArray&_='+new Date().getTime();	/* no-cache */
	}
	
	//alert(args);
	var dbPath=(typeof options.dbpath==='undefined' || options.dbpath==='') ? '' : '/'+options.dbpath+'/';
	var w=window.open('http://test.psksyd.com/Kund/Bridge/Main.nsf/'+'GoogleMaps.htm?openpage'+args, '', strFeatures);
	w.focus();
}

var arrIds=[];
function setIDsArray(ids) {
	arrIds.length=0;
	for (var i=0; i<ids.length; i++) {
		arrIds.push(ids[i]);
	}
}
function getIdsArray() {
	//alert('test\narr:'+arrIds.length);
	return arrIds;
}