// This script pertains to a Google Sheet I have for planning todos, daily activities, habits, etc. 
// It's based on a combination of Shortcut and Habitica, including my own changes. 
// If you'd like to make use of it, just reach out and I'll spool you up a copy of the Google sheet

// Sheet names
var todayName = "Today"
var rewardsName = "Rewards"
var longTermName = "Long Term"

// Sheets
var document = SpreadsheetApp.getActiveSpreadsheet();
var todaySheet = document.getSheetByName(todayName);
var rewardsSheet = document.getSheetByName(rewardsName);
var longTermSheet = document.getSheetByName(longTermName);

var taskLength = 3

var globals = {
  sheet: null,
  range: null,
  value: null,
  row: null
}

function onEdit(e) {
  globals.range = e.range;
  globals.sheet = globals.range.getSheet();
  globals.value = e.value;
  globals.row = globals.range.getRow();

  var sheetName = globals.sheet.getName();

  if (sheetName == todayName) {
    onEditToday();
  }

  if (sheetName == longTermName) {
    onEditLongTerm();
  }
}
