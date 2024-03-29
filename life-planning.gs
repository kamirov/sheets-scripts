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
var regularColIndex = 8   // H
var dailyColIndex = 15    // O
var todoColIndex = 22     // V
var doneIndex = 26        // Z

var todoHeaderRowsCount = 1
var todoDividerRowsCount = 1 
var todoTopPadding = todoHeaderRowsCount + priorityTodosCount + todoDividerRowsCount
var firstNonPriorityTodoRowIndex = todoTopPadding + 1 // +1 cause it's 1 indexed

// Summary
var newDayCheckboxA1 = "AE3"
var randomDailyCheckboxA1 = "AE5"
var randomRegularCheckboxA1 = "AE6"

// Focus
var focusProjectA1 = "AF6"
var focusMultiplier = 3

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
  moveRegularIfNeeded();
  moveDailyIfNeeded();
  moveTodoIfNeeded();
  handleResetIfNeeded();

  handleRandomDaily();
  handleRandomRegular();
}

function handleResetIfNeeded() {
  var newDayCheckboxRange = sheet.getRange(newDayCheckboxA1)

  if (newDayCheckboxRange.getValue()) {
    moveSummary();
    resetDones();
    resetTodos();
    resetDailes();

    newDayCheckboxRange.uncheck();
  }
}

function handleRandomDaily() {
  var handleRandomDailyRange = sheet.getRange(randomDailyCheckboxA1)
  
  if (handleRandomDailyRange.getValue()) {
    moveDaily(getRandomTaskInRange(dailyColIndex))
    handleRandomDailyRange.uncheck();
  }
}

function handleRandomRegular() {
  var handleRandomRegularRange = sheet.getRange(randomRegularCheckboxA1)
  
  if (handleRandomRegularRange.getValue()) {
    focusProjectName = sheet.getRange(focusProjectA1).getValue()
    moveRegular(getRandomTaskInRange(regularColIndex, focusProjectName))
    handleRandomRegularRange.uncheck();
  }
}

function getRandomTaskInRange(taskColIndex, focusProjectName = null) {
  var lastRow = sheet.getLastRow();

  var checkboxRange = sheet.getRange(1, taskColIndex-1, lastRow);
  var checkboxValues = checkboxRange.getValues();

  var projectRange = sheet.getRange(1, taskColIndex, lastRow);
  var projectValues = projectRange.getValues();

  var durationRange = sheet.getRange(1, taskColIndex+4, lastRow);
  var durationValues = durationRange.getValues();

  // Flatten the 2D array and find indices of all cells with FALSE
  var falseIndices = [];
  checkboxValues.forEach(function(row, index) {
    var checkboxValue = row[0];
    var durationValue = durationValues[index][0];
    var projectValue = projectValues[index][0];

    if (checkboxValue === false && (durationValue && typeof durationValue === 'number')) {
        falseIndices.push(index + 1); // Adding 1 to adjust for 0-based indexing

        if (projectValue === focusProjectName) {
          // We start at 1 because the multiplier represent how many EXTRA chances there are to get a task from the focus project. 
          //   We don't want to count the default random chance
          for (var i = 1; i < focusMultiplier; i++) {
              falseIndices.push(index + 1);
          }
        }
    }
  });

  // Check if there are any FALSE values, if not, exit the function
  if (falseIndices.length === 0) return;

  // Choose a random index from the 'falseIndices' array
  return falseIndices[Math.floor(Math.random() * falseIndices.length)];
}

function resetTodos() {
  clearEmptyTasks(firstNonPriorityTodoRowIndex, todoColIndex)
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
  sheet.getRange("Z2:AB").clearContent();
}

function resetDailes() {
  // Reset the dailies by unchecking all checkboxes
  var lastRow = sheet.getLastRow(); // Get the last row with content
  var checkboxesRange = sheet.getRange("N2:N" + lastRow); // Define the range for checkboxes
  checkboxesRange.uncheck(); // Uncheck all checkboxes in the range
}

function moveSummary() {
    const summaryRange = sheet.getRange("AD2:AE2")

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
    var dateRange = rewardsSheet.getRange("A3:B" + lastRow);

    // Move existing date data one row down
    dateRange.copyTo(rewardsSheet.getRange("A4"), {contentsOnly: true});

    // Set the values to the top of the list in "Rewards" sheet
    rewardsSheet.getRange("A3:B3").setValues(valuesToMove);
}

function moveHabitIfNeeded() {
  if (isChecked(habitColIndex)) {
    moveHabit()
    uncheck(habitColIndex);
  }
}

function moveHabit(fromRowIndex = row) {
    copyItem(fromRowIndex, habitColIndex, todoColIndex, todaySheet, firstNonPriorityTodoRowIndex)
    incrementTaskCount(regularColIndex, fromRowIndex)
}

function moveRegularIfNeeded() {
  if (isChecked(regularColIndex)) {
    moveRegular()
    uncheck(regularColIndex);
  }
}

function moveRegular(fromRowIndex = row) {
    copyItem(fromRowIndex, regularColIndex, todoColIndex, todaySheet, firstNonPriorityTodoRowIndex)
    incrementTaskCount(regularColIndex, fromRowIndex)
}

function moveDailyIfNeeded() {
  if (isChecked(dailyColIndex)) {
    moveDaily()
  }
}

function moveDaily(fromRowIndex = row) {
    copyItem(fromRowIndex, dailyColIndex, todoColIndex, todaySheet, firstNonPriorityTodoRowIndex)
    incrementTaskCount(dailyColIndex, fromRowIndex)

    sheet.getRange(fromRowIndex, dailyColIndex-1).check()
}

function incrementTaskCount(taskIndex, fromRowIndex = row) {
  var incrementColumnIndex = taskIndex + 3;
  var cell = sheet.getRange(fromRowIndex, incrementColumnIndex);
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
    var row = range.getRow();
    copyItem(row, fromItemColIndex, toItemColIndex, toSheet)

    // Remove old item
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

function copyItem(fromRowIndex, fromItemColIndex, toItemColIndex, toSheet = sheet, toRowIndex = 1) {
  var taskValues = sheet.getRange(fromRowIndex, fromItemColIndex, 1, taskLength).getValues();

  appendToTaskColumn(toItemColIndex, taskValues, toSheet, toRowIndex);
}

function appendToTaskColumn(toItemColIndex, taskValues, toSheet = sheet, toRowIndex = 1) {
  
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

  if (lastToRow < toRowIndex) {
    lastToRow = toRowIndex
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
