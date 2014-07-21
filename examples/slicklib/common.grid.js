var rows = 1000000;
var dataPage;    
var gridID = '';
var dataReadURL = '';
var columnNames = new Array();
var columnModel = [];
var gridFirstLoad = true;
var xslSheet = ''; 
var readCount = 300;
var isDropDown = false;
var isBasic = false;
var totalRows = 0;

var dataInitMultiselect = function (elem) {
	setTimeout(function () {
		
		var $elem = $(elem), id = elem.id,
            inToolbar = typeof id === "string" && id.substr(0, 3) === "gs_",
            options = {
                selectedList: 2,
                height: "200px",
                checkAllText: "all",
                uncheckAllText: "no",
                noneSelectedText: "Any",
                open: function () {
                    var $menu = $(".ui-multiselect-menu:visible");
                    $menu.width("auto");
                    return;
                }
            },
            $options = $elem.find("option");
        if ($options.length > 0 && $options[0].selected) {
            $options[0].selected = false; // unselect the first selected option
        }
        if (inToolbar) {
            options.minWidth = 'auto';
        }
        $elem.multiselect(options);
        $elem.siblings('button.ui-multiselect').css({
            width: inToolbar ? "98%" : "100%",
            marginTop: "1px",
            marginBottom: "1px",
            paddingTop: "3px"
        });
    }, 300);
};

function InitializeGrid(tableName, dataURL){
	var pagerDiv = 'pager';
	gridID = tableName;
	dataReadURL = dataURL;
	$('<div id="pager"></div>').insertAfter('#' + gridID);
	$.ajax({
		url : dataURL + '?readDesign&outputformat=json',
		type : 'GET',
		success : function(result) {
			rows = GetRowNumber(dataPage);
			CreateColumns(result, tableName, pagerDiv);
			CreateGrid(tableName, pagerDiv, dataURL);
		},
		error : function(ex) {
			alert('Error in reading design');
		}
	});
}

function CreateColumns(columnJSON, tableName, pagerName){
	var viewConfig = viewDesignData[dataPage];
	
	xslSheet = '<?xml version="1.0" encoding="UTF-8"?>';
	xslSheet += '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">';
	xslSheet += '<xsl:template match="viewentries">';
	xslSheet += '<viewentries>';
	xslSheet += '<xsl:copy-of select="@*" />';
	xslSheet += '<xsl:for-each select="viewentry"><viewentry>';
	xslSheet += '<xsl:copy-of select="@*" />';
	xslSheet += '<xsl:element name="id">';
	xslSheet += '<xsl:value-of select="@unid" />';
	xslSheet += '</xsl:element>';
	
	if (typeof viewConfig['BasicGrid'] !== undefined &&
			viewConfig['BasicGrid'] == true) {
		isBasic = true;
		rows = -1;
	}
	
	$.each(columnJSON.column, function (){	
		var colName = this['@title'].replace(/ /g,'');
		var columnConfig = viewConfig[colName];
		
		if ((typeof columnConfig === 'undefined') ||
				(typeof columnConfig['Show'] === 'undefined') ||
				(columnConfig['Show'] == true)) {
			var colNum = parseInt(this['@columnnumber']);
			var colTitle = this['@title'];
			var searchOpt = ['cn'];
			var objModel = { 
				name : colName,
				label : colTitle,
				width : parseInt(this['@width']) * 3,
				frozen : ((columnConfig && typeof(columnConfig.Frozen) !== 'undefined') ?
						columnConfig.Frozen : false),
				key : ((columnConfig && typeof(columnConfig.Key) !== 'undefined') ?
								columnConfig.Key : false),
				hidden : ((columnConfig && typeof(columnConfig.Hidden) !== 'undefined') ?
						columnConfig.Hidden : false),
				sortable : ((columnConfig && typeof(columnConfig.Sort) !== 'undefined') ?
						columnConfig.Sort : true),
				search : ((columnConfig && typeof(columnConfig.Search) !== 'undefined') ?
						columnConfig.Search : true),
				sorttype : ((columnConfig && typeof(columnConfig.SortType) !== 'undefined') ?
						columnConfig.SortType : 'text'),
				stype : ((columnConfig && typeof(columnConfig.SType) !== 'undefined') ?
								columnConfig.SType : 'text'),
				searchoptions : {
					value : ':All'
				},
				jsonmap : 'entrydata.' + colNum + '.text.0'
			};
				var typeTag = 'text';
			if (columnConfig && typeof(columnConfig.DataType) !== 'undefined') {
				typeTag = columnConfig.DataType;
				switch(columnConfig.DataType) {
				case 'textlist':
					typeTag = 'textlist.text.0';
					break;
				case 'number' :
					objModel.formatter = 'number';
					break;
				case 'datetime' :
					//objModel.formatter = 'date';
					break;
				}
				objModel.jsonmap = 'entrydata.' + colNum + '.'+typeTag+'.0';
			}
			if (objModel.sorttype == 'number') {
				delete objModel.stype;
				searchOpt = ['eq','ne','le','lt','gt','ge', 'cn'];			
			}
			
			if (objModel.stype == 'select') {
				isDropDown = true;
				if (typeof(columnConfig.Multiple) !== 'undefined') {
					objModel.searchoptions['attr'] = { multiple : 'multiple', size : 1 };
					objModel.searchoptions['dataInit'] = dataInitMultiselect;
					objModel.searchoptions['clearSearch'] = false;
				}
				searchOpt = ['eq'];
			}
			objModel.searchoptions['sopt'] = searchOpt;
			columnModel.push(objModel);	
			columnNames.push({ Name : colName, colNumber : colNum, 
				DataType : typeTag});
			xslSheet += '<' + objModel.name + '>';
			xslSheet += '<xsl:value-of select="entrydata[@columnnumber=\'' 
				+ colNum + '\']/number" />';
			xslSheet += '<xsl:value-of select="entrydata[@columnnumber=\'' 
				+ colNum + '\']/datetime" />';
			xslSheet += '<xsl:value-of select="normalize-space(entrydata[@columnnumber=\'' 
				+ colNum + '\']/text)" />';
			xslSheet += '<xsl:value-of select="normalize-space(entrydata[@columnnumber=\'' 
				+ colNum + '\']/textlist/text)" />';
			xslSheet += '</' + objModel.name + '>';
		}
	});
	
	xslSheet += '</viewentry> </xsl:for-each> </viewentries>';
	xslSheet += '</xsl:template> </xsl:stylesheet>';
}

function CreateGrid(tableName, pagerDiv, dataURL){
	var wHeight = window.innerHeight - 20;
	var wWidth = window.innerWidth - 15;
	var d1 = new Date();
	console.log('before creation' + d1.getMinutes() + ':' + d1.getSeconds() + '.' + d1.getMilliseconds());
	if (navigator.userAgent.indexOf('ipad') > 0) { rows = 5; }
	$('#' + tableName).jqGrid({
		url : dataURL + '?readviewentries&outputformat=json',
		datatype: 'json',
		loadonce : true,
		height : '80%',
		width : wWidth,
		shrinkToFit : false,
		colModel: columnModel,
		jsonReader : {
			root : 'viewentry',
			cell : 'entrydata',
			records : 'toplevelentries',
			repeatitems: false,
			id : '@unid'
		},
		pager: '#' + pagerDiv,
		rowNum: rows,
		rowList: [1000],
		viewrecords: true,
		gridview: true,
		autoencode: false,
		ignoreCase : true,
		sortable : false,
		multiselect : true,
		multikey : 'ctrlkey',
		beforeProcessing : function ( result, status, xhr) {			
			totalRows = parseInt(result['@toplevelentries']);

			if (parseInt(result.viewentry[result.viewentry.length - 1]['@position'])
					> totalRows) {
				result.viewentry.pop();
			}
		},
		gridComplete : function(){
			
			var d2 = new Date();
			console.log('Grid complete - total rec - ' + $('#' + tableName).jqGrid('getGridParam', 'reccount') + ' ' + d2.getMinutes() + ':' + d2.getSeconds() + '.' + d2.getMilliseconds());
			if ($('#' + tableName).jqGrid('getGridParam', 'rowNum') == 1000000 || rows == -1) {
				$('#pager_center').hide();
			}
			else {
				$('#pager_center').show();
			}
			
			if (gridFirstLoad) {
				var recCount = $('#' + tableName).jqGrid('getGridParam', 'reccount');

				if (recCount < totalRows) {
					GetGridData(tableName, dataURL, recCount + 1);
				}
				else {
					gridFirstLoad = false;
					CreateSelectSearch(tableName);
					$('.loading').hide();
				}
			}
			else {
				CreateSelectSearch(tableName);
			} 
		},
		beforeRequest : function (){
			if (isDropDown) {
				ModifySearchFilter(tableName, ',');
			}
		}
	}).navGrid('#pager', 
		{
			search:true,
			searchOnEnter : true,
			edit: false, 
			add:false, 
			del:false						
		},{},{},{},
		{
			multipleSearch : true
		}
	);
			
	if (!isBasic) {
		$('#' + tableName).jqGrid('navButtonAdd','#pager',
			{
				id:'pager_excel', 
				caption:'',
				title:'Export To Excel',
				onClickButton : function(e){
					try {
						ExportXML(tableName);
					} 
					catch (ex) {
						
					}
				},
				buttonicon:'ui-icon-bookmark'
		});
		
		$('#' + tableName).jqGrid('navButtonAdd','#pager',
			{
				id:'pager_map', 
				caption:'',
				title:'Show in Map',
				onClickButton : function(e){
					try {
						ShowInMap(tableName);
					} catch (ex) {
					}
				},
				buttonicon:'ui-icon-home'
		});
		$("#pager_left table.navtable tbody tr").append ( // here 'pager' part or #pager_left is the id of the pager
		    '<td><div><input type="checkbox" class="cbox" title="Allow Paging" id="navAllowPaging" onclick="ShowPaging(this, \'' + tableName + '\');" /><span>Allow Paging</span></div></td>');
		
		if (rows == 1000) {
			$("#pager_left table.navtable input[type='checkbox']").attr('checked', 'checked');
		}
	
		$('#' + tableName).jqGrid('filterToolbar',{searchOperators: true, searchOnEnter:true });
		$('#' + tableName).jqGrid('setFrozenColumns');		
	}
}


function GetGridData(tableName, dataURL, startPosition) {

	$('.loading').show();
	var d3 = new Date();
	console.log('B4 each call ' + d3.getMinutes() + ':' + d3.getSeconds() + '.' + d3.getMilliseconds());
	$.ajax({
		url : dataURL + '?readviewentries&outputformat=json',
		data : { start : startPosition },
		success : function(result) {
			//var total = 9;
			var d4 = new Date();
			console.log('after ajax call ' + d4.getMinutes() + ':' + d4.getSeconds() + '.' + d4.getMilliseconds());
			//$(result).find('viewentry[categorytotal="true"]').remove();
			if (typeof result.viewentry[result.viewentry.length - 1]['@categorytotal']
			                                                      !== 'undefined'){
				result.viewentry.pop();
			}
			readCount = parseInt(result.viewentry[result.viewentry.length - 1]['@position']);
			/*
			var xmlTrans = XSLTTranformation(result);
			//CreateDojoGrid(xmlTrans);
			//return;
			
			if (xmlTrans == null) {
				alert('Data redefining error');
			} else { 
				var rec = totalRows - readCount + startPosition;
				
				$('#' + tableName).jqGrid('setGridParam', { records : rec });
				SetGridData(tableName, xmlTrans, totalRows);
			}
*/
			var rec = totalRows - readCount + startPosition;			
			$('#' + tableName).jqGrid('setGridParam', { records : rec });
			var formatted = CreateFormattedJSon(result);
			$('#' + tableName).jqGrid('addRowData', 'id', formatted);
			startPosition = readCount + 1;

			if (totalRows < startPosition) {
				gridFirstLoad = false;
				if (rows == 1000) { 
					$('#' + tableName).trigger('reloadGrid');
				}

				$('.loading').hide();
			}
		},
		error : function(ex) {
			alert('Error in reading data');
		}
	});
}

function SetGridData(tableName, xmlData, total) {
	 var d6 = new Date();
	console.log('b4 XMl to JSON ' + d6.getMinutes() + ':' + d6.getSeconds() + '.' + d6.getMilliseconds());
	debugger;
	var x2js = new X2JS();
	var jsonObj = x2js.xml2json(xmlData);
	var d7 = new Date();
	console.log('After XMl to JSON ' + d7.getMinutes() + ':' + d7.getSeconds() + '.' + d7.getMilliseconds());
		
	$('#' + tableName).jqGrid('addRowData', 'id', jsonObj.viewentries.viewentry);
	var d8 = new Date();
	console.log('After Add row data ' + d8.getMinutes() + ':' + d8.getSeconds() + '.' + d8.getMilliseconds());
}


function ShowPaging(chkAllowPaging, tableName) {
	$('.loading').show();
	if ($(chkAllowPaging).is(':checked')) {
		$('#' + tableName).jqGrid('setGridParam', { rowNum : 1000 }).trigger('reloadGrid');
	} else {
		$('#' + tableName).jqGrid('setGridParam', { rowNum : 1000000, page : 1 }).trigger('reloadGrid');
	}
}

function ExportXML(tableName){
	$('.loading').show();
	var link = "data:application/octet-stream;filename=dddd.xls;base64;charset=utf-8,";
	var obj = new X2JS();
	var selIds = $('#' + tableName).jqGrid('getGridParam', 'selarrrow');
	var rowData = $('#' + tableName).jqGrid('getRowData');
	var selRowData = new Array();

	if (selIds.length == 0) {
		var rows = $('#' + tableName).jqGrid('getGridParam', 'rowNum');
		var page = $('#' + tableName).jqGrid('getGridParam', 'page');
		$('#' + tableName).jqGrid('setGridParam', { rowNum : -1, page : 1 }).trigger('reloadGrid');
		selRowData = $('#' + tableName).jqGrid('getRowData');
		
		$('#' + tableName).jqGrid('setGridParam', { rowNum : rows, page : page }).trigger('reloadGrid');
	} else {
		$.each(selIds, function(index, id) {
			selRowData.push($('#' + tableName).jqGrid('getRowData', id));
		})
	}
	$('.loading').show();
	var dontExport = new Array();
	try {
		var viewConfig = viewDesignData[dataPage];
		$.each(viewConfig, function(colName, colObj){
			if ((typeof(colObj['Export']) !== 'undefined') &&
					(colObj['Export'] == false)) {
				dontExport.push(colName);
			}
		});
	} catch (exx){
		alert(exx.message);
	}
	try{
	$.each(selRowData, function(index, item) {
		$.each(dontExport, function(index2, colName){
			delete selRowData[index][colName];
		});
		$.each(item, function(key, value) {
			try{
				selRowData[index][key] = (value.indexOf('<') == -1) ? value : $(value).text();
			}
			catch(ex1){}
		});
	});
	} catch(ex) { alert(ex.message);}
	var data = obj.json2xml_str({ WorkBook : { Rows : selRowData } });
	data = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>' + data;
	//link = link + btoa(data);
	//var wind = window.open('', 'Doc.xml');
	//wind.document.open('text/xml', 'replace');
	
	//wind.document.write(data);
	//wind.document.close();
	//window.open(link);
		
	if (saveAs) {
		saveAs(
			      new Blob(
			          [data]
			        , {type: "application/ms-excel;charset=" + document.characterSet}
			    )
			    , "document.xls"
			);
	}
	else{
		
		var form = "<html><head /><body>";
		form = form + "<form name='exportForm' action='" + siteURL + "/ExportJQGrid?OpenAgent' method='POST'>";
	    form = form + "<input type='hidden' name='dataXml' value='" + data + "'>";
	    form = form + "</form><script>document.exportForm.submit();</script>";
	    form = form + "</body></html>";
	    OpenWindow = window.open('', '');
	    OpenWindow.document.write(form);
	    OpenWindow.document.close();
	}
	$('.loading').hide();
}

function ReloadGridAfterEdit(){
	var tableName = gridID;
	$('#' + tableName).jqGrid('setGridParam', { datatype : 'json'});
	$('#' + tableName).trigger('reloadGrid');
}


function CreateXSL() {
	if (xslSheet != '') {
		return xslSheet;
	}
	xslSheet = '<?xml version="1.0" encoding="UTF-8"?>';
	xslSheet += '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">';
	xslSheet += '<xsl:template match="viewentries">';
	xslSheet += '<viewentries><xsl:for-each select="viewentry"><viewentry>';
	xslSheet += '<xsl:copy-of select="@*" />';
	xslSheet += '<xsl:element name="id">';
	xslSheet += '<xsl:value-of select="@unid" />';
	xslSheet += '</xsl:element>';
	$.each(columnNames, function(index, item){
		xslSheet += '<' + item.Title + '>';
		xslSheet += '<xsl:value-of select="entrydata[@columnnumber=\'' + index + '\']/number" />';
		xslSheet += '<xsl:value-of select="entrydata[@columnnumber=\'' + index + '\']/text" />';
		xslSheet += '</' + item.Title + '>';
	});
	
	xslSheet += '</viewentry> </xsl:for-each> </viewentries>';
	xslSheet += '</xsl:template> </xsl:stylesheet>';
	return xslSheet;
}

function XSLTTranformation(xmlData){
	var xsl = CreateXSL();
	if (document.implementation && document.implementation.createDocument && typeof XSLTProcessor != 'undefined') {
		return XSLTOtherBrowser(xsl, xmlData); 
	}
	else {
		return XSLTInternetExplorer(xsl, xmlData);
	}
}

function XSLTInternetExplorer(xsl, xmlData) {
	var xslDoc;
	var xmlDoc;	
	
	try {
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.load(xmlData);
		xslDoc = new ActiveXObject("Microsoft.XMLDOM");
		xslDoc.loadXML(xsl);
		var transXML = xmlDoc.transformNode(xslDoc);
		console.log(transXML);
		return $.parseXML(transXML);
	}
	catch(ex) {
		return null; 
	}  
}

function XSLTOtherBrowser(xsl, xmlData) {
	var xslDoc;
	var xmlDoc;
	
	if (window.DOMParser) {
		parser=new DOMParser();
		xslDoc = parser.parseFromString(xsl,"text/xml");
	}
	
	if (document.implementation && document.implementation.createDocument) {
	  var xsltProcessor = new XSLTProcessor();
	  xsltProcessor.importStylesheet(xslDoc);
	  var transf = xsltProcessor.transformToDocument(xmlData);
	  return transf;
	}
	else {
		alert('Browser support error');
	}
	
	return null;
}


function CreateSelectSearch(tableName){
	var filters = $('#' + tableName).jqGrid('getGridParam', 'postData').filters;
	$($('#' + tableName).jqGrid('getGridParam', 'colModel')).each(function(index, item){
		if(item['stype'] == 'select' && 
				(filters == undefined || filters.indexOf(item.name) == -1)) {
			//debugger;
				var options = '<option value="">All</option>';
				item.searchoptions['value'] = ':All';
				$(GetUniqueValues(tableName, item.name)).each(function(index, colItem){
					options += '<option value="'+colItem+'">'+colItem+'</option>'
					item.searchoptions.value += ';' + colItem + ':' + colItem;
				});
				if ((typeof item.searchoptions.attr !== 'undefined') && 
						(typeof item.searchoptions.attr.multiple !== 'undefined')) {
					item.searchoptions['attr'] = { multiple: 'multiple', size: 1 };				
				}
				$("#" + tableName).jqGrid('setColProp', item.name, item);
				
				$('select#gs_' + item.name).html(options);
				if ((typeof item.searchoptions.attr !== 'undefined')
					&& (typeof item.searchoptions.attr.multiple !== 'undefined')){
					$('select#gs_' + item.name + ' option').first().remove();
					dataInitMultiselect($('select#gs_' + item.name));
					$('select#gs_' + item.name).multiselect('refresh');
				}			
		}
	});
	//$('select[id^="gs_"][multiple="multiple"]').multiselect('refresh');
}

function GetUniqueValues(tableName, columnName){
	var items = new Array();
	var allItems = $.map($('#' + tableName).jqGrid('getRowData'), function(item){ return item[columnName]; });
	$(allItems).each(function(index2, dataItem){
		if (items.indexOf(dataItem) == -1){
			items.push(dataItem);
		}
	});
	return items;
}

function ModifySearchFilter(tableName, separator){
	var i, l, rules, rule, parts, j, group, str, iCol, cmi;
    var cm = $('#' + tableName).jqGrid('getGridParam', 'colModel');
    var filters;
    if ($('#' + tableName).jqGrid('getGridParam', 'postData').filters) {
    	filters = $.parseJSON($('#' + tableName).jqGrid('getGridParam', 'postData').filters);
    }
    if (filters && filters.rules !== undefined && filters.rules.length > 0) {
        rules = filters.rules;
        for (i = 0; i < rules.length; i++) {
        	rule = rules[i];
        	iCol = getColumnIndexByName( tableName, rule.field);
        	cmi = cm[iCol];
        	if (iCol >= 0 &&
        			cmi.stype === 'select' && (rule.op === 'eq')) {
        		// make modifications only for the 'contains' operation
        		parts = rule.data.split(separator);
        		if (parts.length > 1) {
        			if (filters.groups === undefined) {
        				filters.groups = [];
        			}
        			group = {
        				groupOp: 'OR',
        				groups: [],
        				rules: []
        			};
        			filters.groups.push(group);
        			for (j = 0, l = parts.length; j < l; j++) {
        				str = parts[j];
        				if (str) {
        					// skip empty '', which exist in case of two separaters of once
        					group.rules.push({
        						data: parts[j],
        						op: rule.op,
        						field: rule.field
        					});
        				}
        			}
        			rules.splice(i, 1);
        			i--; // to skip i++
        		}
        	}
        }
        $('#' + tableName).jqGrid('getGridParam','postData').filters = JSON.stringify(filters);
    }
}

function getColumnIndexByName(tableName, columnName) {
	var cm = $('#' + tableName).jqGrid('getGridParam', 'colModel'), i, l = cm.length;
    for (i = 0; i < l; i += 1) {
    	if (cm[i].name === columnName) {
            return i; // return the index
        }
    }
    return -1;
}

function CreateFormattedJSon(result) {
	var l = result.viewentry.length;
	var formatted = new Array();
	for (var i = 0; i < l; i++) {
		var obj = { id : result.viewentry[i]['@unid'] };
		$.each(columnNames, function(){
			obj[this.Name] = result.viewentry[i].entrydata[this.colNumber][this.DataType][0];
		});
		formatted.push(obj);
	}
	
	return formatted;
}
