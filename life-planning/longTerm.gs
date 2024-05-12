// Titles (Long Term)
var milestoneTitle = 'Milestones 💎'
var backlogTitle = 'Backlog'
var soonTitle = 'Soon'

// Long Term
var milestoneColIndex = findColumnIndexInHeader(longTermSheet, milestoneTitle)-1
var backlogColIndex = findColumnIndexInHeader(longTermSheet, backlogTitle)-1
var soonColIndex = findColumnIndexInHeader(longTermSheet, soonTitle)-1

function onEditLongTerm() {
  moveBacklogIfNeeded();
  moveMilestoneIfNeeded();
  moveSoonIfNeeded();
}

function moveMilestoneIfNeeded() {
  if (isChecked(milestoneColIndex)) {
    // moveItemIfNeeded(milestoneColIndex, bigPrizesColIndex, rewardsSheet)
    startRowIndex = 2
    clearEmptyTasks(startRowIndex, milestoneColIndex)
  }
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
