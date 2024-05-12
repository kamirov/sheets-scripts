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
