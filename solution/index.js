/**************** Select Elements ****************/

//Layout Elements
const todoSection = document.querySelector('.todo-section')
const doneSection = document.querySelector('.done-section')
const inProgressSection = document.querySelector('.in-progress-section')
const mainContianer = document.querySelector('.main-container')
//List Elements
const doneTasks = document.querySelector('.done-tasks')
const todoTasks = document.querySelector('.to-do-tasks')
const inProgressTasks = document.querySelector('.in-progress-tasks')
//Task Elements
const taskBox = document.createElement('div')
//Utility Elements
const searchInput = document.querySelector('#search')
const optionBox = document.querySelector('.option-box')
const loader = document.querySelector('.loader')

/**************** Constants ****************/

const POSSIBLE_KEYS = ['1', '2', '3']

const EMPTY_TASKS_DATA = { todo: [], 'in-progress': [], done: [] }

/**************** Event Handlers ****************/

/**Handles click events by delegation.
 ** Checks if input is not empty before allowing to add.
 ** Captures and saves data after adding a task.
 * @param {Object} event - event object recieved from the event listener
 */
function handleClick(event) {
  if (event.target.className.includes('submit-task')) {
    const list = event.target.parentElement.querySelector('ul')
    assertInputNotEmpty(list)
    const taskText = event.target.parentElement.querySelector('input').value
    addTaskBox(list, taskText)
    captureData()
  }
}

/**Handles double click events.
 * Makes the double-clicked event editable.
 * @param {Object} event - event object recieved from the event listener
 */
function handleDoubleClick(event) {
  const eventTarget = event.target
  eventTarget.setAttribute('contenteditable', true)
  // eventTarget.addEventListener('input', handleInput)
}

/**Handles keyboard events.
 * If a task box is being hovered, allows task removal with ALT + num shortcut.
 * @param {Object} event - event object recieved from the event listener
 */
function handleKeyPress(event) {
  if (document.querySelector('task-box:hover')) {
    if (event.altKey && POSSIBLE_KEYS.includes(event.key)) {
      handleMultipleKeys(event)
    }
  }
}

/**Handles focusout events.
 * Removes the 'contenteditable' attribute.
 * @param {Object} event - event object recieved from the event listener
 */
function handleFocusOut(event) {
  event.target.setAttribute('contenteditable', false)
}

/**
 * Saves the board for every element edit event.
 */
function handleInput() {
  if (document.querySelector('div:focus')) {
    console.log('focus detected')
    captureData()
  }
}

/**Handles multiple keystroke events.
 * Uses an options dictionary to match the corresponding number pressed to a list.
 * Pressing a number that does not match any dictionary property will result in no action.
 * @param {Object} event - event object recieved from the event listener
 */
function handleMultipleKeys(event) {
  const task = document.querySelector('task-box:hover').parentElement

  const options = {
    1: todoTasks,
    2: inProgressTasks,
    3: doneTasks,
  }

  const list = options[event.key]

  if (list) {
    moveTask(task, list)
  }
}

/**Handles input events targeting the search box.
 * @param {Object} event - event object recieved from the event listener
 */
function handleSearchInput(event) {
  filterTasks(event.target.value)
}

/**Handles click events targeting an option button.
 * Passes a request by checking the button's class name.
 * @param {Object} event - event object recieved from the event listener
 */
function handleOptionClick(event) {
  handleRequest(event.target.className)
}

/**
 * Sends an HTTP request. Gets a string describing the type of request.
 * @param {String} req - the type of request to send
 */
async function handleRequest(req) {
  displayLoader()
  if (req === 'load') {
    await getRemoteData()
  }
  if (req === 'save') {
    await storeRemoteData()
  }
  removeLoader()
}

/**************** Classes ****************/

/** Initializes a class for the custom element 'task-box'.*/
class TaskBox extends HTMLElement {
  constructor() {
    super()
  }
  /**
   * Add a div element whenever the element is added to the DOM.
   */
  connectedCallback() {
    let container = document.createElement('div')
    this.append(container)
  }
}

customElements.define('task-box', TaskBox)

/**************** Utility Functions ****************/

/** Creates a new task-box element and adds it to the list passed.
 *
 * @param {Element} list - the element that will contain the task-box
 * @param {String} text - the text to be inserted inside the task-box
 */
function addTaskBox(list, text) {
  const taskBox = document.createElement('task-box')
  const listItem = document.createElement('li')
  listItem.classList.add('task')
  listItem.append(taskBox)
  listItem.setAttribute('draggable', true)
  list.insertBefore(listItem, list.firstChild)
  taskBox.querySelector('div').textContent = text
}

/**
 * Moves a given task to a given list. Saves to localStorage after moving.
 * @param {Element} task - task element to be moved
 * @param {Element} list - list element to move the task to
 */
function moveTask(task, list) {
  addTaskBox(list, stripTaskBox(task))
  removeTask(task)
  captureData()
}

/**
 * Removes a task element.
 * @param {Element} task - the task element to remove.
 */
function removeTask(task) {
  task.remove()
}

/**
 *Clears the section's list from tasks completely
 * @param {Array} sections - Array of sections to clear
 */
function cleanSection(sections) {
  sections.forEach((section) =>
    section.querySelectorAll('li').forEach((item) => removeTask(item))
  )
}

/**
 * Sets the hidden attribute of an element to true or false.
 * @param {Element} task - the task element to hide
 * @param {Boolean} state - Boolean representing what the hidden attribute should be set to
 */
function isTaskHidden(task, state) {
  task.parentElement.hidden = state
}

/**
 * Gets a section and creates an object containig the section name as a key and an array with it's taskBoxes texts as a value.
 * The key name is the sections class name without the string '-section'
 * @param {Element} section - the section element to extract data from
 * @returns an object containing the section name as key and taskBox texts array as value
 */
function extractData(section) {
  const sectionName = getSectionTitle(section)
  const tasksArray = getTaskList(section)
  const strippedTasksArray = tasksArray.map(stripTaskBox)
  return { [sectionName]: strippedTasksArray }
}

/**
 * Gets a taskBox and extracts text from it.
 * @param {Element} taskBox
 * @returns the text from the taskBox
 */
function stripTaskBox(taskBox) {
  const text = taskBox.querySelector('div').textContent
  return text
}

/** Takes data and displays it by adding it to the page.
 *  each array item of dataArray consists of one sub-array with the section name, and a second sub-array with that section's tasks texts.
 * @param {Object} data - the data from which information will be parsed
 */
function insertData(data) {
  const dataArray = Object.entries(data)
  dataArray.forEach((subArr) => {
    const sectionElement = getSectionElementByTitle(subArr[0])
    const listElement = sectionElement.querySelector('ul')
    const textsArray = subArr[1]
    //reverse it for creating each taskBox in the order they appeared last.
    textsArray.reverse()
    textsArray.forEach((text) => {
      addTaskBox(listElement, text)
    })
  })
}

/**
 * Filters tasks based on a given string.
 ** Hides tasks that do not match the query.
 ** Updates result on every keystroke.
 ** Case insensitive.
 * @param {String} text the text to filter the tasks by
 */
function filterTasks(text) {
  text = text.toLowerCase()
  const sections = document.querySelectorAll('section')
  sections.forEach((section) => {
    const tasks = getTaskList(section)
    tasks.forEach((task) => {
      if (!stripTaskBox(task).toLowerCase().includes(text)) {
        isTaskHidden(task, true)
      } else {
        isTaskHidden(task, false)
      }
    })
  })
}

/**
 * Creates a loader animation and displays it.
 */
function displayLoader() {
  const loader = document.createElement('div')
  loader.classList.add('loader')
  mainContianer.append(loader)
}

/**
 * Removes the loader animation by removing the element.
 */
function removeLoader() {
  const loader = document.querySelector('.loader')
  loader.remove()
}

/**
 * Gets the essential section title by cutting off the '-section' string.
 * @param {Element} section the section HTMLElement
 * @returns string representing the section name
 */
function getSectionTitle(section) {
  const sectionClassName = [...section.classList].join('')
  const sectionName = sectionClassName.replace('-section', '')
  return sectionName
}

/**
 * Gets the section element of the given essential title by adding a '-section' string to it
 * @param {String} title string representing the essential section name
 * @returns {Element} the given title's corresponding section HTMLElement
 */
function getSectionElementByTitle(title) {
  const sectionName = title + '-section'
  const sectionElement = document.querySelector(`.${sectionName}`)
  return sectionElement
}

/**
 * Return an array with a given section's taskBoxes
 * @param {Element} section the section HTMLElement
 * @returns an array containing the section's taskBox elements
 */
function getTaskList(section) {
  const tasks = section.querySelectorAll('task-box')
  return [...tasks]
}

/**************** Storage Functions ****************/

/**Captures a snapshot of the data on the page and stores it in localStorage
 * @returns the data to store in the form of an object
 */
function captureData() {
  const sections = [...document.querySelectorAll('section')]
  const tasksArray = sections.map(extractData)
  const dataObject = {}
  tasksArray.forEach((item) => {
    Object.assign(dataObject, item)
  })
  storeLocally(dataObject)
  return dataObject
}

/**Stores the data captured in localStorage.
 * @param {Object} data - the object that contains the data to be stored
 */
function storeLocally(data) {
  localStorage.setItem('tasks', JSON.stringify(data))
}

/** Loads data from localStorage. Creates data item in localStorage if it is empty.
 */
function loadData() {
  assertDataNotEmpty()
  const data = JSON.parse(localStorage.getItem('tasks'))
  insertData(data)
}

/**
 *  Loads a given data object from a remote source and displays it on the board.
 *  Begins by clearing the board, then inserting the data, and the storing the loaded data locally.
 * @param {Object} data the data object to load
 */
function loadRemoteData(data) {
  cleanSection(document.querySelectorAll('section'))
  insertData(data)
  storeLocally(data)
}
/**************** Drag & Drop Functions ****************/

//////////////////////////////////////////////

var dragged

/* events fired on the draggable target */
document.addEventListener('drag', function (event) {})

document.addEventListener(
  'dragstart',
  function (event) {
    dragged = event.target
    event.target.style.opacity = 0.5
  },
  false
)

document.addEventListener(
  'dragend',
  function (event) {
    event.target.style.opacity = ''
  },
  false
)

/* events fired on the drop targets */
document.addEventListener(
  'dragover',
  function (event) {
    event.preventDefault()
  },
  false
)

document.addEventListener(
  'dragenter',
  function (event) {
    // highlight potential drop target when the draggable element enters it
    if (event.target.className.includes('section')) {
      event.target.style.background = 'purple'
    }
  },
  false
)

document.addEventListener(
  'dragleave',
  function (event) {
    // reset background of potential drop target when the draggable element leaves it
    if (event.target.className.includes('section')) {
      event.target.style.background = ''
    }
  },
  false
)

document.addEventListener(
  'drop',
  function (event) {
    event.preventDefault()
    // move dragged elem to the selected drop target
    if (event.target.className.includes('section')) {
      event.target.style.background = ''
      dragged.parentNode.removeChild(dragged)
      const list = event.target.querySelector('ul')
      list.insertBefore(dragged, list.firstChild)
    }
  },
  false
)

/////////////////////////////////////////////////

/**************** Assert Functions ****************/

/** Checks if localStorage contains any related data. If not, stores an empty template data object.*/
function assertDataNotEmpty() {
  if (!localStorage.getItem('tasks')) {
    captureData()
  }
}

/**
 * Gets a list. Checks if that list's input is not empty.
 * @param {Element} list - the list that shares the input element's parent
 */
function assertInputNotEmpty(list) {
  const input = list.parentElement.querySelector('input')
  if (input.value === '') {
    throw 'you must enter a value'
  }
}

/**************** Event Listeners ****************/

mainContianer.addEventListener('click', handleClick)

optionBox.addEventListener('click', handleOptionClick)

window.addEventListener('load', loadData)

window.addEventListener('keydown', handleKeyPress)

mainContianer.addEventListener('dblclick', handleDoubleClick)

mainContianer.addEventListener('focusout', handleFocusOut)

mainContianer.addEventListener('input', handleInput)

searchInput.addEventListener('input', handleSearchInput)

/**************** HTTP Requests ****************/

async function getRemoteData() {
  const response = await fetch(
    'https://json-bins.herokuapp.com/bin/614aea974021ac0e6c080c61',
    {
      method: 'GET',
    }
  )
  const data = await response.json()
  loadRemoteData(data.tasks)
  return data.tasks
}

async function storeRemoteData() {
  await fetch('https://json-bins.herokuapp.com/bin/614aea974021ac0e6c080c61', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prepareRemoteDataBody()),
  })
}

function prepareRemoteDataBody() {
  const remoteData = {
    _id: '614aea974021ac0e6c080c61',
    name: 'Ido',
    tasks: captureData(),
    createdAt: '2021-09-22T08:34:31.333Z',
    updatedAt: '2021-09-22T08:34:31.333Z',
  }
  return remoteData
}
