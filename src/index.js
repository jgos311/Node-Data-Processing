#!/usr/bin/env node

let fs = require('fs');
const readline = require('readline');

taskOneMasterJson = {
    "Regions":{},
    "ItemTypes":{}
},taskTwoMasterJson = {}, taskThreeMasterJson = {};

let computeDaysToShipGivenOrder = function(orderDate, shippedDate){
    orderDate = new Date(orderDate);
    shippedDate = new Date(shippedDate);

    let differenceInTime = shippedDate.getTime() - orderDate.getTime();
    let differenceInDays = differenceInTime / (1000 * 3600 * 24);
    
    return differenceInDays;
};

let taskOne= function(taskOneMasterJson, csvRow){
    let buildCountryItemTotalObject = function(masterObject, csvRowData){
        let regionName = csvRowData[0];
        let countryName = csvRowData[1];
        let countryItemType = csvRowData[2];
        let totalItemTypeRevenue = 0;
        let totalItemTypeCost = 0;
        let totalItemTypeProfit = 0;
        if(countryItemType in masterObject["Regions"][regionName]["Countries"][countryName]["ItemTypes"]){
            totalItemTypeRevenue = parseFloat(csvRowData[11]) +masterObject["Regions"][regionName]["Countries"][countryName]["ItemTypes"][countryItemType]["Total"]["Revenue"];
            totalItemTypeCost = parseFloat(csvRowData[12]) + masterObject["Regions"][regionName]["Countries"][countryName]["ItemTypes"][countryItemType]["Total"]["Cost"];
            totalItemTypeProfit = parseFloat(csvRowData[13]) +masterObject["Regions"][regionName]["Countries"][countryName]["ItemTypes"][countryItemType]["Total"]["Profit"];
        }else {
            totalItemTypeRevenue = parseFloat(csvRowData[11]);
            totalItemTypeCost = parseFloat(csvRowData[12]);
            totalItemTypeProfit =parseFloat(csvRowData[13]);
        }

        masterObject["Regions"][regionName]["Countries"][countryName]["ItemTypes"][countryItemType] = {
            "Total":{
                "Revenue":totalItemTypeRevenue,
                "Cost":totalItemTypeCost,
                "Profit":totalItemTypeProfit
            }
        };
    };

    let buildCountryObject = function(masterObject, csvRowData){
        let regionName = csvRowData[0], countryName = csvRowData[1], totalCountryRevenue = 0,
            totalCountryCost = 0, totalCountryProfit = 0, sumOfDaysToShip = 0, totalOrders = 0;

        if(countryName in masterObject["Regions"][regionName]["Countries"]){
            totalCountryRevenue = parseFloat(csvRowData[11]) + masterObject["Regions"][regionName]["Countries"][countryName]["Total"]["Revenue"];
            totalCountryCost = parseFloat(csvRowData[12]) + masterObject["Regions"][regionName]["Countries"][countryName]["Total"]["Cost"];
            totalCountryProfit = parseFloat(csvRowData[13]) + masterObject["Regions"][regionName]["Countries"][countryName]["Total"]["Profit"];
            sumOfDaysToShip = masterObject["Regions"][regionName]["Countries"][countryName]["SumOfDaysToShip"]+computeDaysToShipGivenOrder(csvRowData[5].trim(), csvRowData[7].trim());
            totalOrders = masterObject["Regions"][regionName]["Countries"][countryName]["TotalOrders"] + 1;
        } else {
            totalCountryRevenue = parseFloat(csvRowData[11]);
            totalCountryCost = parseFloat(csvRowData[12]);
            totalCountryProfit = parseFloat(csvRowData[13]);
            sumOfDaysToShip = computeDaysToShipGivenOrder(csvRowData[5].trim(), csvRowData[7].trim());
            totalOrders = 1;
            masterObject["Regions"][regionName]["Countries"][countryName]= {"Total":{},"ItemTypes" : {}};
        }
        masterObject["Regions"][regionName]["Countries"][countryName]["Total"]["Revenue"]=totalCountryRevenue;
        masterObject["Regions"][regionName]["Countries"][countryName]["Total"]["Cost"] = totalCountryCost;
        masterObject["Regions"][regionName]["Countries"][countryName]["Total"]["Profit"] = totalCountryProfit;
        masterObject["Regions"][regionName]["Countries"][countryName]["SumOfDaysToShip"] = sumOfDaysToShip;
        masterObject["Regions"][regionName]["Countries"][countryName]["TotalOrders"] = totalOrders;

        masterObject["Regions"][regionName]["SumOfDaysToShip"] = masterObject["Regions"][regionName]["SumOfDaysToShip"] + sumOfDaysToShip;
        masterObject["Regions"][regionName]["TotalOrders"] = masterObject["Regions"][regionName]["TotalOrders"]+totalOrders;

        
        buildCountryItemTotalObject(masterObject, csvRowData);
    };
    
    let buildRegionTotalObject = function(masterObject, csvRowData){
        let regionName = csvRowData[0], totalRevenue = 0, totalCost = 0, totalProfit = 0,
            sumOfDaysToShip = 0, totalOrders = 0;

        if(regionName in masterObject["Regions"]){
            totalRevenue = masterObject["Regions"][regionName]["Total"]["Revenue"]+parseFloat(csvRowData[11]);
            totalCost = masterObject["Regions"][regionName]["Total"]["Cost"]+parseFloat(csvRowData[12]);
            totalProfit = masterObject["Regions"][regionName]["Total"]["Profit"]+parseFloat(csvRowData[13]);
        } else{
            totalRevenue = parseFloat(csvRowData[11]);
            totalCost = parseFloat(csvRowData[12]);
            totalProfit = parseFloat(csvRowData[13]);
            sumOfDaysToShip = 0;
            totalOrders = 0;
            masterObject["Regions"][regionName] = {
                "Total":{},
                "Countries":{}
            };
        }

        masterObject["Regions"][regionName]["Total"]["Revenue"] = totalRevenue;
        masterObject["Regions"][regionName]["Total"]["Cost"] = totalCost;
        masterObject["Regions"][regionName]["Total"]["Profit"] = totalProfit;
        masterObject["Regions"][regionName]["SumOfDaysToShip"] = sumOfDaysToShip;
        masterObject["Regions"][regionName]["TotalOrders"] = totalOrders;

        buildCountryObject(masterObject,csvRowData);
    };
    
    var buildItemTotalObject = function(masterObject, csvRowData){
        var itemType = csvRowData[2];
        if(itemType in masterObject["ItemTypes"]){
            masterObject["ItemTypes"][itemType]["Total"]["Revenue"] = masterObject["ItemTypes"][itemType]["Total"]["Revenue"]+parseFloat(csvRowData[11]);
            masterObject["ItemTypes"][itemType]["Total"]["Cost"] = masterObject["ItemTypes"][itemType]["Total"]["Cost"]+parseFloat(csvRowData[12]);
            masterObject["ItemTypes"][itemType]["Total"]["Profit"] = masterObject["ItemTypes"][itemType]["Total"]["Profit"]+parseFloat(csvRowData[12]);
        } else {
            masterObject["ItemTypes"][itemType] = {
                "Total":{
                    "Revenue":parseFloat(csvRowData[11]),
                    "Cost":parseFloat(csvRowData[12]),
                    "Profit":parseFloat(csvRowData[13])
                }
            };
        }
    };
    
    buildRegionTotalObject(taskOneMasterJson, csvRow);
    buildItemTotalObject(taskOneMasterJson, csvRow);
};

let taskTwo = function(csvRow){
    let orderPriority = csvRow[4];
    let month = csvRow[5].trim().split('/')[0];
    let year = csvRow[5].trim().split('/')[2];
    let yearLastTwoDigits = year.substring(year.length-2);

    if(year === yearLastTwoDigits){
        year = 20+yearLastTwoDigits;
    }

    if(year in taskTwoMasterJson){
        if(month in taskTwoMasterJson[year]){
            taskTwoMasterJson[year][month]["SumOfDaysToShip"] = taskTwoMasterJson[year][month]["SumOfDaysToShip"] + computeDaysToShipGivenOrder(csvRow[5].trim(), csvRow[7].trim());
            taskTwoMasterJson[year][month]["TotalOrders"] = taskTwoMasterJson[year][month]["TotalOrders"] + 1;
        
            if(orderPriority in taskTwoMasterJson[year][month]){
                taskTwoMasterJson[year][month][orderPriority] += 1;
            } else {
                taskTwoMasterJson[year][month][orderPriority] = 1;
            }
        } else {
            taskTwoMasterJson[year][month] = {};
            taskTwoMasterJson[year][month]["SumOfDaysToShip"] = computeDaysToShipGivenOrder(csvRow[5].trim(), csvRow[7].trim());
            taskTwoMasterJson[year][month]["TotalOrders"] = 1;
            taskTwoMasterJson[year][month][orderPriority] = 1;
        }
    } else {
        taskTwoMasterJson[year] = {};
        taskTwoMasterJson[year][month] = {};
        taskTwoMasterJson[year][month]["SumOfDaysToShip"] = computeDaysToShipGivenOrder(csvRow[5].trim(), csvRow[7].trim());
        taskTwoMasterJson[year][month]["TotalOrders"] = 1;
        taskTwoMasterJson[year][month][orderPriority] = 1;
    }
};

let taskThree = function(taskOneMasterJson, taskTwoMasterJson, csvRowData){
    let buildDataPerMonth = function(taskTwoMasterJson, taskThreeMasterObject, csvRowData){
        let month = csvRowData[5].trim().split('/')[0];
        let year = csvRowData[5].trim().split('/')[2];
        let yearLastTwoDigits = year.substring(year.length-2);

        if(year === yearLastTwoDigits){
            year = 20+yearLastTwoDigits;
        }
        
        if(!taskThreeMasterObject[year]){
            taskThreeMasterObject[year] = {};
            taskThreeMasterObject[year][month] = {};
            taskThreeMasterObject[year][month]["Regions"] ={};
        } else {
            if(!taskThreeMasterObject[year][month]){
                taskThreeMasterObject[year][month] = {};
                taskThreeMasterObject[year][month]["Regions"] ={
                    "Countries":{}
                };
            }
        }

        taskThreeMasterObject[year][month]["TotalOrders"] = taskTwoMasterJson[year][month]["TotalOrders"];
        taskThreeMasterObject[year][month]["AverageDaysToShip"] = Math.ceil(taskTwoMasterJson[year][month]["SumOfDaysToShip"]/taskTwoMasterJson[year][month]["TotalOrders"]);
    };

    let buildDataPerCountry = function(taskOneMasterJson, taskThreeMasterObject, csvRowData){
        let region = csvRowData[0];
        let country = csvRowData[1];
        let month = csvRowData[5].trim().split('/')[0];
        let year = csvRowData[5].trim().split('/')[2];
        let yearLastTwoDigits = year.substring(year.length-2);

        if(year === yearLastTwoDigits){
            year = 20+yearLastTwoDigits;
        }

        if(!taskThreeMasterObject[year][month]["Regions"][region]){
            taskThreeMasterObject[year][month]["Regions"][region]= {
                "Countries":{}
            };
            taskThreeMasterObject[year][month]["Regions"][region]["Countries"][country]= {};

        } else {
            if(!taskThreeMasterObject[year][month]["Regions"][region]["Countries"][country]){
                taskThreeMasterObject[year][month]["Regions"][region]["Countries"][country]= {};
            }
        }
        taskThreeMasterObject[year][month]["Regions"][region]["AverageDaysToShip"] = Math.ceil(taskOneMasterJson["Regions"][region]["SumOfDaysToShip"]/taskOneMasterJson["Regions"][region]["TotalOrders"]);
        taskThreeMasterObject[year][month]["Regions"][region]["TotalOrders"] = taskOneMasterJson["Regions"][region]["TotalOrders"];
        taskThreeMasterObject[year][month]["Regions"][region]["Countries"][country]["AverageDaysToShip"] = Math.ceil(taskOneMasterJson["Regions"][region]["Countries"][country]["SumOfDaysToShip"] / taskOneMasterJson["Regions"][region]["Countries"][country]["TotalOrders"]);
        taskThreeMasterObject[year][month]["Regions"][region]["Countries"][country]["TotalOrders"] = taskOneMasterJson["Regions"][region]["Countries"][country]["TotalOrders"];
    };

    buildDataPerMonth(taskTwoMasterJson, taskThreeMasterJson, csvRowData);
    buildDataPerCountry(taskOneMasterJson, taskThreeMasterJson, csvRowData)
};

const readStream = fs.createReadStream( __dirname +"/node-data-processing-medium-data.csv" );
//const readStream = fs.createReadStream( __dirname +"/test.csv" );

const taskOneWriteStream = fs.createWriteStream( 'taskOne.json', { encoding: "utf8"} );
const taskTwoWriteStream = fs.createWriteStream( 'taskTwo.json', { encoding: "utf8"} );;
const taskThreeWriteStream = fs.createWriteStream( 'taskThree.json', { encoding: "utf8"} );;

const rl = readline.createInterface({
    input: readStream
});

rl.on( "line", function(csvLine) {
    let cvsRowData = csvLine.split(',');
    if(cvsRowData.length > 0 && cvsRowData[0] !== 'Region' && cvsRowData[0]){
        taskOne(taskOneMasterJson, cvsRowData);
        taskTwo(cvsRowData);
        taskThree(taskOneMasterJson, taskTwoMasterJson, cvsRowData);
    }
});

rl.on("close",function(){
    fs.writeFile('taskOne.json', JSON.stringify(taskOneMasterJson), function (err) {
        if (err) throw err;
    });
    
    fs.writeFile('taskTwo.json', JSON.stringify(taskTwoMasterJson), function (err) {
        if (err) throw err;
    });
    
    fs.writeFile('taskThree.json', JSON.stringify(taskThreeMasterJson), function (err) {
        if (err) throw err;
    });
    console.log('Done!');
});


