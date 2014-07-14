define(function () {
    return {
        getColumns: function () { return columns; },
    	getExceldata:function() {
    			selectedIndexes = grid.getSelectedRows();
			  	var selectedData =[];
			  	var count = 0;
			  	if(selectedIndexes.length>0){
			  	for(index in selectedIndexes){
				      formatedarray = {};
				      for(key in dataView.getItem(index)){
				        for(columnkey in columns){
				                if(columns[columnkey]['field']==key){
				                    formatedarray[columns[columnkey]['name'].replace(/[^a-zA-Z]/g, "")] = data[index][key];
				                }
				              }
				      }
				     selectedData[count]  = formatedarray;
				      count++;
				  }
				}else{
				  for(var allrowcount=0;allrowcount<dataView.getLength();allrowcount++){
				      formatedarray = [];
				      for(key in dataView.getItem(allrowcount)){
				      		if(key!=='id' && key!=='id'){
				             formatedarray.push(data[allrowcount][key]);
				         	}
				           }
				     selectedData.push(formatedarray);
				  }
				}
			return selectedData;


    	}
    };




});