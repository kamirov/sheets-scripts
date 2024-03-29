// This script pertains to a Google Sheet I have for planning todos, daily activities, habits, etc. 
// It's based on a combination of Shortcut and Habitica, including my own changes. 
// If you'd like to make use of it, just reach out and I'll spool you up a copy of the Google sheet

// If changing these counts, adjust the coloring for the divider manually in the sheet
var priorityHabitsCount = 1
var priorityDailiesCount = 2
var priorityTodosCount = 3

// Sheets
var todayName = "Today"
var rewardsName = "Rewards"
var longTermName = "Long Term"


// Titles (Long Term)
var backlogTitle = 'Backlog'
var soonTitle = 'Soon'

// Titles (Today)
var habitTitle = 'Habits'
var hobbyTitle = 'Hobbies'
var dailyTitle = 'Dailies'
var restrictionsTitle = 'Restrictions'
var todoTitle = 'To Do'
var doneTitle = 'Done'
var summaryTitle = 'Summary'
var doingTitle = 'Doing'

// Titles (Rewards)
var earningsTitle = 'Earnings'


// -- Implementation --

// Sheets

var document = SpreadsheetApp.getActiveSpreadsheet();
var todaySheet = document.getSheetByName(todayName);
var rewardsSheet = document.getSheetByName(rewardsName);
var longTermSheet = document.getSheetByName(longTermName);

// Long Term
var backlogColIndex = findColumnIndexInHeader(longTermSheet, backlogTitle)-1
var soonColIndex = findColumnIndexInHeader(longTermSheet, soonTitle)-1

// Today 
var habitColIndex = findColumnIndexInHeader(todaySheet, habitTitle)-1
var hobbyColIndex = findColumnIndexInHeader(todaySheet, hobbyTitle)-1
var dailyColIndex = findColumnIndexInHeader(todaySheet, dailyTitle)-1
var restrictionsColIndex = findColumnIndexInHeader(todaySheet, restrictionsTitle)-1
var todoColIndex = findColumnIndexInHeader(todaySheet, todoTitle)-1
var doingColIndex = findColumnIndexInHeader(todaySheet, doingTitle)-1
var doneIndex = findColumnIndexInHeader(todaySheet, doneTitle)-1

var todoHeaderRowsCount = 1
var todoDividerRowsCount = 1 
var todoTopPadding = todoHeaderRowsCount + priorityTodosCount + todoDividerRowsCount
var firstNonPriorityTodoRowIndex = todoTopPadding + 1 // +1 cause it's 1 indexed

// Summary
var summaryColIndex = findColumnIndexInHeader(todaySheet, summaryTitle)
var summaryColCheckboxA1 = columnIndexToLetter(summaryColIndex + 1) // Checkbox is the next column
var newDayCheckboxA1 = `${summaryColCheckboxA1}3`
var randomHobbyCheckboxA1 = `${summaryColCheckboxA1}5`
var focusProjectA1 = `${summaryColCheckboxA1}6`
var focusFactorA1 = `${summaryColCheckboxA1}7`

var taskLength = 3

// Focus
var focusMultiplier = todaySheet.getRange(focusFactorA1).getValue()

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


// TODAY

function onEditToday() {
  moveHabitIfNeeded();
  moveHobbyIfNeeded();
  moveDailyIfNeeded();
  moveRestrictionIfNeeded();
  moveTodoIfNeeded();
  moveDoingIfNeeded();
  handleResetIfNeeded();

  handleRandomHobby();
}

function handleResetIfNeeded() {
  var newDayCheckboxRange = globals.sheet.getRange(newDayCheckboxA1)

  if (newDayCheckboxRange.getValue()) {
    moveSummary();
    resetDones();
    resetTodos();
    resetDoings();
    resetDailes();
    resetRestrictions();

    newDayCheckboxRange.uncheck();
  }
}

function handleRandomHobby() {  
  var handleRandomHobbyRange = globals.sheet.getRange(randomHobbyCheckboxA1)
  
  if (handleRandomHobbyRange.getValue()) {
    focusProjectName = globals.sheet.getRange(focusProjectA1).getValue()
    moveHobby(getRandomTaskInRange(hobbyColIndex, focusProjectName))
    handleRandomHobbyRange.uncheck();
  }
}

function getRandomTaskInRange(taskColIndex, focusProjectName = null) {
  var lastRow = globals.sheet.getLastRow();

  var checkboxRange = globals.sheet.getRange(1, taskColIndex-1, lastRow);
  var checkboxValues = checkboxRange.getValues();

  var projectRange = globals.sheet.getRange(1, taskColIndex, lastRow);
  var projectValues = projectRange.getValues();

  var durationRange = globals.sheet.getRange(1, taskColIndex+4, lastRow);
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

function resetDoings() {
  clearEmptyTasks(2, doingColIndex)
}

function clearEmptyTasks(startRowIndex, startColIndex) {
  var startColLetter = columnIndexToLetter(startColIndex)
  var endColLetter = columnIndexToLetter(startColIndex + taskLength-1)

  var rangeBoundaries = startColLetter + startRowIndex + ":" + endColLetter

  var toClearRange = globals.sheet.getRange(rangeBoundaries);
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
    globals.sheet.getRange(newToClearRangeBoundaries).setValues(nonBlankRows);
  }
}

function resetDones() {
  reset(doneIndex, 'clear')
}

function resetDailes() {
  reset(dailyColIndex, 'check')
}

function resetRestrictions() {
  reset(restrictionsColIndex, 'check')
}

function reset(colIndex, resetType) {
  const checkboxA1 = columnIndexToLetter(colIndex-1)
  const startA1 = `${checkboxA1}2`  // 2 to account for header
  const endA1 = `${checkboxA1}`     // No number, we want all the rows

  var checkboxesRange = globals.sheet.getRange(`${startA1}:${endA1}`); // Define the range for checkboxes

  if (resetType === 'check') {
    checkboxesRange.uncheck(); // Uncheck all checkboxes in the range
  } else if (resetType === 'clear') {
      globals.sheet.getRange(`${startA1}:${endA1}`).clearContent();
  } else {
    throw new Error(`Unsupported reset type '${resetType}'`)
  }
}

function moveSummary() {
    const summaryRangeStart = `${columnIndexToLetter(summaryColIndex)}2`
    const summaryRangeEnd = `${summaryColCheckboxA1}2`
    
    const summaryRange = globals.sheet.getRange(`${summaryRangeStart}:${summaryRangeEnd}`)

    var valuesToMove = summaryRange.getValues();

    // Calculate yesterday's date
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Format yesterday's date as a string to match Google Sheets date format
    // Note: Adjust the date format string as per your requirement
    var formattedDate = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy-MM-dd");

    // Replace the value in the first cell of valuesToMove with yesterday's date
    valuesToMove[0][0] = formattedDate;

    const earningsColIndex = findColumnIndexInHeader(rewardsSheet, earningsTitle)
    const earningsColA1 = columnIndexToLetter(earningsColIndex)
    const earningsEndColA1 = columnIndexToLetter(earningsColIndex + 1)

    // Determine the range to shift down - start from A2 to avoid overwriting headers if any
    var lastRow = rewardsSheet.getLastRow();
    var dateRange = rewardsSheet.getRange(`${earningsColA1}3:${earningsEndColA1}${lastRow}`);

    // Move existing date data one row down
    dateRange.copyTo(rewardsSheet.getRange(`${earningsColA1}4`), {contentsOnly: true});

    // Set the values to the top of the list in "Rewards" sheet
    rewardsSheet.getRange(`${earningsColA1}3:${earningsEndColA1}3`).setValues(valuesToMove);
}

function moveHabitIfNeeded() {
  if (isChecked(habitColIndex)) {
    moveHabit()
    uncheck(habitColIndex);
  }
}

function moveHabit(fromRowIndex = globals.row) {
    copyItem(fromRowIndex, habitColIndex, doneIndex, todaySheet, firstNonPriorityTodoRowIndex)
    incrementTaskCount(hobbyColIndex, fromRowIndex)
}

function moveHobbyIfNeeded() {
  if (isChecked(hobbyColIndex)) {
    moveHobby()
    uncheck(hobbyColIndex);
  }
}

function moveHobby(fromRowIndex = globals.row) {
    copyItem(fromRowIndex, hobbyColIndex, doingColIndex, todaySheet)
    incrementTaskCount(hobbyColIndex, fromRowIndex)
}

function moveDailyIfNeeded() {
  if (isChecked(dailyColIndex)) {
    moveDaily()
  }
}

function moveRestrictionIfNeeded() {
  if (isChecked(restrictionsColIndex)) {
    moveRestriction()
  }
}

function moveRestriction(fromRowIndex = globals.row) {
    copyItem(fromRowIndex, restrictionsColIndex, doneIndex, todaySheet)
    incrementTaskCount(restrictionsColIndex, fromRowIndex)

    globals.sheet.getRange(fromRowIndex, restrictionsColIndex-1).check()
}

function moveDaily(fromRowIndex = globals.row) {
    copyItem(fromRowIndex, dailyColIndex, doingColIndex, todaySheet)

    globals.sheet.getRange(fromRowIndex, dailyColIndex-1).check()
}

function incrementTaskCount(taskIndex, fromRowIndex = globals.row) {
  var incrementColumnIndex = taskIndex + 3;
  var cell = globals.sheet.getRange(fromRowIndex, incrementColumnIndex);
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
    moveItemIfNeeded(todoColIndex, doingColIndex)
    resetTodos();
  }
}

function moveDoingIfNeeded() {
  if (isChecked(doingColIndex)) {
    moveItemIfNeeded(doingColIndex, doneIndex)
    resetDoings();
  }
}

function moveItemIfNeeded(fromItemColIndex, toItemColIndex, toSheet = globals.sheet) {
  if (isChecked(fromItemColIndex)) {
    var row = globals.range.getRow();
    copyItem(row, fromItemColIndex, toItemColIndex, toSheet)

    // Remove old item
    globals.sheet.getRange(row, fromItemColIndex, 1, taskLength).clearContent();

    uncheck(fromItemColIndex);
  }
}

function isChecked(taskIndex) {
  const checkBoxIndex = taskIndex - 1;

  return globals.range.getColumn() == checkBoxIndex && globals.value == "TRUE"
}

function uncheck(taskIndex) {
  const checkBoxIndex = taskIndex - 1;
  globals.sheet.getRange(globals.row, checkBoxIndex).uncheck();
}

function copyItem(fromRowIndex, fromItemColIndex, toItemColIndex, toSheet = globals.sheet, toRowIndex = 1) {
  var taskValues = globals.sheet.getRange(fromRowIndex, fromItemColIndex, 1, taskLength).getValues();

  appendToTaskColumn(toItemColIndex, taskValues, toSheet, toRowIndex);
}

function appendToTaskColumn(toItemColIndex, taskValues, toSheet = globals.sheet, toRowIndex = 1) {
  
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

function findColumnIndexInHeader(sheet, label) {
  // Get the first row's values (headers)
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Find the index of the given label in the headers array
  var columnIndex = headers.indexOf(label);
  
  // Log the result
  if (columnIndex === -1) { // indexOf returns -1 if not found, but we added 1 earlier
    throw new Error("Column '" + label + "' not found.");
  }
  
  return columnIndex + 1 // +1 cause we're 1-indexed
}
