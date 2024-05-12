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

function reset(colIndex, resetType) {
  const checkboxA1 = columnIndexToLetter(colIndex-1)
  const startA1 = `${checkboxA1}2`  // 2 to account for header

  // TODO: Right now, 'check' refers to dailies, which have 1 extra column for 'duration'. I think we should include a more general solution to determine task length
  const endIndex = colIndex + taskLength - 1 + (resetType === 'check' ? 1 : 0)
  const endA1 = columnIndexToLetter(endIndex)     // No number, we want all the rows
  const taskRange = globals.sheet.getRange(`${startA1}:${endA1}`);
  
  if (resetType === 'check') {
    // Sort rows by checked status
    taskRange.sort({column: colIndex-1, ascending: true});

    const checkBoxrange = globals.sheet.getRange(`${startA1}:${checkboxA1}`); // Define the range for checkboxes
    checkBoxrange.uncheck(); // Uncheck all checkboxes in the range
  } else if (resetType === 'clear') {
    taskRange.clearContent();
  } else {
    throw new Error(`Unsupported reset type '${resetType}'`)
  }
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
