// This script pertains to a Google Sheet I have for planning todos, daily activities, habits, etc. 
// It's based on a combination of Shortcut and Habitica, including my own changes. 
// If you'd like to make use of it, just reach out and I'll spool you up a copy of the Google sheet

// If changing these counts, adjust the coloring for the divider manually in the sheet
var priorityHabitsCount = 1
var priorityDailiesCount = 2
var priorityTodosCount = 3


// -- Implementation --

// Long Term
var backlogColIndex = 5   // E
var soonColIndex = 10     // J

// Today 
var habitColIndex = 2     // B
var dailyColIndex = 8     // H
var todoColIndex = 15     // O
var doneIndex = 19        


var taskLength = 3

var todayName = "Today"
var rewardsName = "Rewards"
var longTermName = "Long Term"

var document = SpreadsheetApp.getActiveSpreadsheet();
var todaySheet = document.getSheetByName(todayName);
var rewardsSheet = document.getSheetByName(rewardsName);
var longTerm = document.getSheetByName(longTermName);

var sheet;
var range;
var value;
var row

function onEdit(e) {
  range = e.range;
  sheet = range.getSheet();
  value = e.value;
  row = range.getRow();

  var sheetName = sheet.getName();

  if (sheetName == todayName) {
    onEditToday();
  }

  if (sheetName == longTermName) {
    onEditLongTerm();
  }
}

function onEditLongTerm() {
  moveBacklogIfNeeded();
  moveSoonIfNeeded();
}

function moveBacklogIfNeeded() {
  if (isChecked(backlogColIndex)) {
    moveItemIfNeeded(backlogColIndex, soonColIndex)

    startRowIndex = 2
    clearEmptyTasks(startRowIndex, backlogColIndex)
  }
}

function moveSoonIfNeeded() {
  if (isChecked(soonColIndex)) {
    moveItemIfNeeded(soonColIndex, todoColIndex, todaySheet)
    startRowIndex = 2
    clearEmptyTasks(startRowIndex, soonColIndex)
  }
}

function onEditToday() {
  moveHabitIfNeeded();
  moveDailyIfNeeded();
  moveTodoIfNeeded();
  handleResetIfNeeded();
}

function handleResetIfNeeded() {
  var editedRow = range.getRow();
  var editedColumn = range.getColumn();

  // Check if the edit is in cell Y2 and the checkbox is checked
  if (editedRow == 2 && editedColumn == 25 && value == "TRUE") { // Column Y is the 25th column

    moveSummary();
    resetDones();
    resetTodos();
    resetDailes();

    sheet.getRange("Y2").uncheck();
  }
}

function resetTodos() {
  var headerRowsCount = 1
  var dividerRowsCount = 1 
  var topPadding = headerRowsCount + priorityTodosCount + dividerRowsCount
  var firstNonPriorityRowIndex = topPadding + 1 // +1 cause it's 1 indexed

  clearEmptyTasks(firstNonPriorityRowIndex, todoColIndex)
}

function clearEmptyTasks(startRowIndex, startColIndex) {
  var startColLetter = columnIndexToLetter(startColIndex)
  var endColLetter = columnIndexToLetter(startColIndex + taskLength-1)

  var rangeBoundaries = startColLetter + startRowIndex + ":" + endColLetter

  var toClearRange = sheet.getRange(rangeBoundaries);
  var toClearValues = toClearRange.getValues();
  var nonBlankRows = [];

  // Collect non-blank rows
  for (var i = 0; i < toClearValues.length; i++) {
    var toClearRow = toClearValues[i];
    var isRowBlank = toClearRow.every(function(cell) { return cell === ""; });

    if (!isRowBlank) {
      nonBlankRows.push(toClearRow);
    }
  }


  var topPadding = startRowIndex - 1 // 1 cause of 1-index
  var newToClearRangeBoundaries = rangeBoundaries + (topPadding + nonBlankRows.length)

  // Clear the original range
  toClearRange.clearContent();

  // Write the non-blank rows back to the sheet starting from N2
  if (nonBlankRows.length > 0) {
    sheet.getRange(newToClearRangeBoundaries).setValues(nonBlankRows);
  }
}

function resetDones() {
  sheet.getRange("S2:U").clearContent();
}

function resetDailes() {
  // Reset the dailies by unchecking all checkboxes in G2:G
  var lastRow = sheet.getLastRow(); // Get the last row with content
  var checkboxesRange = sheet.getRange("G2:G" + lastRow); // Define the range for checkboxes
  checkboxesRange.uncheck(); // Uncheck all checkboxes in the range
}

function moveSummary() {
    const summaryRange = sheet.getRange("W2:X2")

    // Get values from W2:X2
    var valuesToMove = summaryRange.getValues();

    // Calculate yesterday's date
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Format yesterday's date as a string to match Google Sheets date format
    // Note: Adjust the date format string as per your requirement
    var formattedDate = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "EEE, MMM d, yyyy");

    // Replace the value in the first cell of valuesToMove with yesterday's date
    valuesToMove[0][0] = formattedDate;

    // Determine the range to shift down - start from A2 to avoid overwriting headers if any
    var lastRow = rewardsSheet.getLastRow();
    var dateRange = rewardsSheet.getRange("A2:B" + lastRow);

    // Move existing date data one row down
    dateRange.copyTo(rewardsSheet.getRange("A3"), {contentsOnly: true});

    // Set the values to the top of the list in "Rewards" sheet
    rewardsSheet.getRange("A2:B2").setValues(valuesToMove);
}

function moveHabitIfNeeded() {
  if (isChecked(habitColIndex)) {
    copyItem(habitColIndex, doneIndex)
    incrementTaskCount(habitColIndex)
    uncheck(habitColIndex);
  }
}

function moveDailyIfNeeded() {
  if (isChecked(dailyColIndex)) {
    copyItem(dailyColIndex, doneIndex)
    incrementTaskCount(dailyColIndex)
  }
}

function incrementTaskCount(taskIndex) {
  var row = range.getRow();

  var incrementColumnIndex = taskIndex + 3;
  var cell = sheet.getRange(row, incrementColumnIndex);
  var currentValue = cell.getValue();

  // Check if the current value is a number and increment it
  if (!isNaN(currentValue)) {
    cell.setValue(currentValue + 1);
  } else {
    // If the current value is not a number, you might want to log an error or set it to a default value
    console.log("The cell value is not a number. Cannot increment.");
  }
}

function moveTodoIfNeeded() {
  if (isChecked(todoColIndex)) {
    moveItemIfNeeded(todoColIndex, doneIndex)
    resetTodos();
  }
}

function moveItemIfNeeded(fromItemColIndex, toItemColIndex, toSheet = sheet) {
  if (isChecked(fromItemColIndex)) {
    copyItem(fromItemColIndex, toItemColIndex, toSheet)

    // Remove old item
    var row = range.getRow();
    sheet.getRange(row, fromItemColIndex, 1, taskLength).clearContent();

    uncheck(fromItemColIndex);
  }
}

function isChecked(taskIndex) {
  const checkBoxIndex = taskIndex - 1;

  return range.getColumn() == checkBoxIndex && value == "TRUE"
}

function uncheck(taskIndex) {
  const checkBoxIndex = taskIndex - 1;
  sheet.getRange(row, checkBoxIndex).uncheck();
}

function copyItem(fromItemColIndex, toItemColIndex, toSheet = sheet) {
  var taskValues = sheet.getRange(row, fromItemColIndex, 1, taskLength).getValues();

  appendToTaskColumn(toItemColIndex, taskValues, toSheet);
}

function appendToTaskColumn(toItemColIndex, taskValues, toSheet = sheet) {
  
  // to-column
  var lastRow = toSheet.getLastRow();
  var toRangeValues = toSheet.getRange(1, toItemColIndex, lastRow, taskLength).getValues();

  var lastToRow = lastRow;
  for (var i = toRangeValues.length - 1; i >= 0; i--) {
    if (!toRangeValues[i].every(cell => cell === "")) {
      lastToRow = i + 1; // +1 because array is 0-indexed but rows are 1-indexed
      break;
    }
  }

  // If the to-section is not empty, adjust lastToRow to point to the first empty row after the last task
  if (lastToRow != lastRow) {
    lastToRow += 1;
  }

  // Append the task at the bottom of the to-section
  toSheet.getRange(lastToRow, toItemColIndex, 1, taskLength).setValues(taskValues);
}


// -- Common utility functions --

function columnIndexToLetter(columnIndex) {
  var temp, letter = '';
  while (columnIndex > 0) {
    temp = (columnIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnIndex = (columnIndex - temp - 1) / 26;
  }
  return letter;
}
