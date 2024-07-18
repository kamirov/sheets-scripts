// If changing these counts, adjust the coloring for the divider manually in the sheet
var priorityHabitsCount = 1
var priorityDailiesCount = 2
var priorityTodosCount = 3

// Titles (Today)
var habitTitle = 'Habits'
var hobbyTitle = 'Hobbies'
var dailyTitle = 'Dailies'
var weeklyTitle = 'Weeklies'
var restrictionsTitle = 'Restrictions'
var todoTitle = 'To Do'
var doneTitle = 'Done'
var summaryTitle = 'Summary'
var doingTitle = 'Doing'

// Col Indices
var habitColIndex = findColumnIndexInHeader(todaySheet, habitTitle)-1
var hobbyColIndex = findColumnIndexInHeader(todaySheet, hobbyTitle)-1
var dailyColIndex = findColumnIndexInHeader(todaySheet, dailyTitle)-1
var weeklyColIndex = findColumnIndexInHeader(todaySheet, weeklyTitle)-1
var restrictionsColIndex = findColumnIndexInHeader(todaySheet, restrictionsTitle)-1
var todoColIndex = findColumnIndexInHeader(todaySheet, todoTitle)-1
var doingColIndex = findColumnIndexInHeader(todaySheet, doingTitle)-1
var doneColIndex = findColumnIndexInHeader(todaySheet, doneTitle)-1

// Misc
var todoHeaderRowsCount = 1
var todoDividerRowsCount = 1 
var todoTopPadding = todoHeaderRowsCount + priorityTodosCount + todoDividerRowsCount
var firstNonPriorityTodoRowIndex = todoTopPadding + 1 // +1 cause it's 1 indexed

// Summary
var summaryColIndex = findColumnIndexInHeader(todaySheet, summaryTitle)
var summaryColCheckboxA1 = columnIndexToLetter(summaryColIndex + 1) // Checkbox is the next column
var newDayCheckboxA1 = `${summaryColCheckboxA1}3`
var newWeekCheckboxA1 = `${summaryColCheckboxA1}4`

const breatheToggleCheckboxA1 = `${summaryColCheckboxA1}5`
const breatheModeEnabled = todaySheet.getRange(breatheToggleCheckboxA1).getValue()


// var randomHobbyCheckboxA1 = `${summaryColCheckboxA1}5`
// var focusProjectA1 = `${summaryColCheckboxA1}6`
// var focusFactorA1 = `${summaryColCheckboxA1}7`

// Focus
// var focusMultiplier = todaySheet.getRange(focusFactorA1).getValue()

function onEditToday() {
  moveHabitIfNeeded();
  moveHobbyIfNeeded();
  moveDailyIfNeeded();
  moveWeeklyIfNeeded();
  moveRestrictionIfNeeded();
  moveTodoIfNeeded();
  moveDoingIfNeeded();
  handleNewDayIfNeeded();
  handleNewWeekIfNeeded();
  handleBreatheModeToggle()

  // handleRandomHobby();
}

function handleBreatheModeToggle() {
  const startHideColIndex = doingColIndex-1 // Accounts for checkbox
  const endColOffsetFromStart = taskLength + 2 // +1 to offset for checkbox, +1 to include the divider column

  if (breatheModeEnabled) {
    todaySheet.showColumns(startHideColIndex, endColOffsetFromStart);
  } else {
    todaySheet.hideColumns(startHideColIndex, endColOffsetFromStart);
  }
}


function moveSummary() {
    const summaryRangeStart = `${columnIndexToLetter(summaryColIndex)}2`
    const summaryRangeEnd = `${summaryColCheckboxA1}2`
    
    const summaryRange = todaySheet.getRange(`${summaryRangeStart}:${summaryRangeEnd}`)

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
    copyItem(fromRowIndex, habitColIndex, doneColIndex, todaySheet)
    incrementTaskCount(hobbyColIndex, fromRowIndex)
}

function moveHobbyIfNeeded() {
  if (isChecked(hobbyColIndex)) {
    moveHobby()
    uncheck(hobbyColIndex);
  }
}

function moveHobby(fromRowIndex = globals.row) {
    copyItem(fromRowIndex, hobbyColIndex, doneColIndex, todaySheet)
    incrementTaskCount(hobbyColIndex, fromRowIndex)
}

function moveDailyIfNeeded() {
  if (isChecked(dailyColIndex)) {
    moveDaily()
  }
}

function moveWeeklyIfNeeded() {
  if (isChecked(weeklyColIndex)) {
    moveWeekly()
  }
}

function moveRestrictionIfNeeded() {
  if (isChecked(restrictionsColIndex)) {
    moveRestriction()
  }
}

function moveRestriction(fromRowIndex = globals.row) {
    copyItem(fromRowIndex, restrictionsColIndex, doneColIndex, todaySheet)
    incrementTaskCount(restrictionsColIndex, fromRowIndex)

    todaySheet.getRange(fromRowIndex, restrictionsColIndex-1).check()
}

function moveDaily(fromRowIndex = globals.row) {
    const destinationColIndex = breatheModeEnabled ? doingColIndex : doneColIndex

    copyItem(fromRowIndex, dailyColIndex, destinationColIndex, todaySheet)

    todaySheet.getRange(fromRowIndex, dailyColIndex-1).check()
}

function moveWeekly(fromRowIndex = globals.row) {
    const destinationColIndex = breatheModeEnabled ? doingColIndex : doneColIndex

    copyItem(fromRowIndex, weeklyColIndex, destinationColIndex, todaySheet)

    todaySheet.getRange(fromRowIndex, weeklyColIndex-1).check()
}

function moveTodoIfNeeded() {
  if (isChecked(todoColIndex)) {
    const destinationColIndex = breatheModeEnabled ? doingColIndex : doneColIndex

    moveItemIfNeeded(todoColIndex, destinationColIndex, todaySheet)
    resetTodos();
  }
}

function moveDoingIfNeeded() {
  if (isChecked(doingColIndex)) {
    moveItemIfNeeded(doingColIndex, doneColIndex, todaySheet)
    resetDoings();
  }
}

function handleNewDayIfNeeded() {
  var newDayCheckboxRange = todaySheet.getRange(newDayCheckboxA1)

  if (newDayCheckboxRange.getValue()) {
    moveSummary();
    resetDones();
    resetTodos();
    resetDoings();
    resetDailies();
    resetRestrictions();

    newDayCheckboxRange.uncheck();
  }
}

function handleNewWeekIfNeeded() {
  var newWeekCheckboxRange = todaySheet.getRange(newWeekCheckboxA1)

  if (newWeekCheckboxRange.getValue()) {
    resetWeeklies();

    newWeekCheckboxRange.uncheck();
  }
}

// function handleRandomHobby() {  
//   var handleRandomHobbyRange = todaySheet.getRange(randomHobbyCheckboxA1)
  
//   if (handleRandomHobbyRange.getValue()) {
//     focusProjectName = todaySheet.getRange(focusProjectA1).getValue()
//     moveHobby(getRandomTaskInRange(hobbyColIndex, focusProjectName))
//     handleRandomHobbyRange.uncheck();
//   }
// }

function resetTodos() {
  clearEmptyTasks(firstNonPriorityTodoRowIndex, todoColIndex)
}

function resetDoings() {
  clearEmptyTasks(2, doingColIndex)
}

function resetDones() {
  reset(doneColIndex, 'clear')
}

function resetDailies() {
  reset(dailyColIndex, 'check', false)
}

function resetWeeklies() {
  reset(weeklyColIndex, 'check', false)
}

function resetRestrictions() {
  reset(restrictionsColIndex, 'check')
}
