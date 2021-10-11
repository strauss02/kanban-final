/** ************** Select Elements *************** */

// Layout Elements

const mainContainer = document.querySelector('.main-container')
// List Elements
const doneTasks = document.querySelector('.done-tasks')
const todoTasks = document.querySelector('.to-do-tasks')
const inProgressTasks = document.querySelector('.in-progress-tasks')
// Task Elements
// Utility Elements
const searchInput = document.querySelector('#search')
const optionBox = document.querySelector('.option-box')

/** ************** Constants *************** */
//
const POSSIBLE_KEYS = ['1', '2', '3']

const NETWORK_ERR =
  'Whoops! There was a network error. Please know, this is not your fault.'

const INPUT_ERR = 'you must enter a value'
/** ************** Utility Functions *************** */

/**
 * Sets the hidden attribute of an element to true or false.
 * @param {Element} task - the task element to hide
 * @param {Boolean} state - Boolean representing what the hidden attribute should be set to
 */
function isTaskHidden(task, state) {
  const predicate = task
  predicate.parentElement.hidden = state
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
 * Gets a taskBox and extracts text from it.
 * @param {Element} taskBox
 * @returns the text from the taskBox
 */
function stripTaskBox(taskBox) {
  const text = taskBox.querySelector('div').textContent
  return text
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
 * Gets the section element of the given essential title by adding a '-section' string to it
 * @param {String} title string representing the essential section name
 * @returns {Element} the given title's corresponding section HTMLElement
 */
function getSectionElementByTitle(title) {
  const sectionName = `${title}-section`
  const sectionElement = document.querySelector(`.${sectionName}`)
  return sectionElement
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
    // reverse it for creating each taskBox in the order they appeared last.
    textsArray.reverse()
    textsArray.forEach((text) => {
      addTaskBox(listElement, text)
    })
  })
}

/**
 * Creates a taskbox component with all the required sub-elements
 * @returns {Element} an html taskbox element prepared for appending
 */
function prepareTaskBox() {
  const taskBox = document.createElement('task-box')
  const container = document.createElement('div')
  const button = document.createElement('button')
  button.classList.add('remove-btn')
  button.innerHTML = '<i class="far fa-times-circle fa-2x"></i>'
  taskBox.append(container)
  taskBox.append(button)
  return taskBox
}

/**
 * Filters tasks based on a given string.
 ** Hides tasks that do not match the query.
 ** Updates result on every keystroke.
 ** Case insensitive.
 * @param {String} text the text to filter the tasks by
 */
function filterTasks(text) {
  const lowerCaseText = text.toLowerCase()
  const sections = document.querySelectorAll('section')
  sections.forEach((section) => {
    const tasks = getTaskList(section)
    tasks.forEach((task) => {
      if (!stripTaskBox(task).toLowerCase().includes(lowerCaseText)) {
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
  const loaderContainer = document.createElement('div')
  loaderContainer.classList.add('loader-container')
  loader.classList.add('loader')

  loaderContainer.append(loader)
  document.body.append(loaderContainer)
}

/**
 * Removes the loader animation by removing the element.
 */
function removeLoader() {
  const loader = document.querySelector('.loader-container')
  loader.remove()
}

/**
 * Disables any option to create another network request while some other request is being handled.
 * @param boolean {Boolean} - a true / false statement on wether to grey out the buttons or not.
 */
function greyOutButtons(boolean) {
  const buttons = document.querySelectorAll('button')
  if (boolean) {
    buttons.forEach((button) => button.setAttribute('disabled', true))
  } else {
    buttons.forEach((button) => button.removeAttribute('disabled'))
  }
}

/** ************** Storage Functions *************** */

/** Stores the data captured in localStorage.
 * @param {Object} data - the object that contains the data to be stored
 */
function storeLocally(data) {
  localStorage.setItem('tasks', JSON.stringify(data))
}

/** Captures a snapshot of the data on the page and stores it in localStorage
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
  cleanSections(document.querySelectorAll('section'))
  insertData(data)
  storeLocally(data)
}

/** ************** Assert Functions *************** */

/** Checks if localStorage contains any related data. If not, stores an empty template data object. */
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
  const input = list.parentElement.querySelector('.add-task-input')
  if (input.value === '') {
    throw INPUT_ERR
  }
}

/** ************** Classes *************** */

/** Initializes a class for the custom element 'task-box'. */
class TaskBox extends HTMLElement {}

customElements.define('task-box', TaskBox)

/** ************** User Interface *************** */
function DisplayInfo(text) {
  alert(text)
}

/** Creates a new task-box element and adds it to the list passed.
 *
 * @param {Element} list - the element that will contain the task-box
 * @param {String} text - the text to be inserted inside the task-box
 */
function addTaskBox(list, text) {
  const taskBox = prepareTaskBox()
  const listItem = document.createElement('li')
  listItem.classList.add('task')
  listItem.append(taskBox)
  listItem.setAttribute('draggable', true)
  list.insertBefore(listItem, list.firstChild)
  taskBox.querySelector('div').textContent = text
}

/**
 * Removes a task element.
 * @param {Element} task - the task element to remove.
 */
function removeTask(task) {
  task.remove()
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
 *Clears the section's list from tasks completely
 * @param {Array} sections - Array of sections to clear
 */
function cleanSections(sections) {
  sections.forEach((section) =>
    section.querySelectorAll('li').forEach((item) => removeTask(item))
  )
}

/**
 * Displays the color picker
 * @param {Object} event the event dispatched by the event listener
 */
function displayColorPicker(event) {
  const div = document.createElement('div')
  div.classList.add('color-picker-container')
  const input = document.createElement('input')
  input.classList.add('color-picker')
  input.setAttribute('type', 'color')
  div.append(input)
  event.target.closest('.section-options').append(div)
}

function removeColorPicker(event) {
  const colorPickerContainer = event.target
    .closest('section')
    .querySelector('.color-picker-container')
  colorPickerContainer.remove()
}

/** ************** HTTP Requests *************** */

/**
 * Prepares a dedicated data object especially for storing data in the remote storage bin.
 * @returns {Object}  a data object containing task information and some other properties required for API communication.
 */
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

/**
 * Gets remote data from an API storage bin.
 * @returns {Object}  a data object containing task information
 */
async function getRemoteData() {
  const response = await fetch(
    'https://json-bins.herokuapp.com/bin/614aea974021ac0e6c080c61',
    {
      method: 'GET',
    }
  )
  const data = await response.json()
  if (response.status > 200) {
    throw NETWORK_ERR
  }
  loadRemoteData(data.tasks)
  return data.tasks
}

/** Stores data in a remote API storage bin. */
async function storeRemoteData() {
  const response = await fetch(
    'https://json-bins.herokuapp.com/bin/614aea974021ac0e6c080c61',
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prepareRemoteDataBody()),
    }
  )
  if (response.status > 200) {
    throw NETWORK_ERR
  }
}

/** ************** Event Handlers *************** */
/** Handles task submission button clicks.
 ** Prevents adding of empty tasks.
 ** takes the value from the input and uses it as the text for the task-box added
 ** ends by capturing data
 * @param {Object} event - event object recieved from the event listener
 */
function handleTaskSubmit(event) {
  const list = event.target.parentElement.querySelector('ul')
  assertInputNotEmpty(list)
  const taskText = event.target
    .closest('section')
    .querySelector('.add-task-input').value
  addTaskBox(list, taskText)
  captureData()
}

/** Handles click events by delegation.
 ** Checks if input is not empty before allowing to add.
 ** Captures and saves data after adding a task.
 * @param {Object} event - event object recieved from the event listener
 */
function handleClick(event) {
  try {
    if (event.target.className.includes('submit-task')) {
      handleTaskSubmit(event)
    } else {
      switch (event.target.parentElement.className) {
        case 'remove-btn':
          removeTask(event.target.closest('li'))
          captureData()
          break
        case 'clean-section-btn':
          cleanSections([event.target.closest('section')])
          captureData()
          break
        case 'change-color-btn':
          if (!event.target.closest('section').querySelector('.color-picker')) {
            displayColorPicker(event)
          } else {
            removeColorPicker(event)
          }
          break
        default:
          break
      }
    }
  } catch (error) {
    alert(error)
  }
}

/** Handles double click events.
 * Makes the double-clicked event editable.
 * @param {Object} event - event object recieved from the event listener
 */
function handleDoubleClick(event) {
  const eventTarget = event.target
  eventTarget.setAttribute('contenteditable', true)
}

/** Handles multiple keystroke events.
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
/** Handles keyboard events.
 * If a task box is being hovered, allows task removal with ALT + num shortcut.
 * @param {Object} event - event object recieved from the event listener
 */
function handleKeyPress(event) {
  if (
    document.querySelector('task-box:hover') &&
    event.altKey &&
    POSSIBLE_KEYS.includes(event.key)
  ) {
    handleMultipleKeys(event)
  }
}

/** Handles focusout events.
 * Removes the 'contenteditable' attribute.
 * @param {Object} event - event object recieved from the event listener
 */
function handleFocusOut(event) {
  event.target.setAttribute('contenteditable', false)
}

/**
 * Saves the board for every element edit event.
 */
function handleInput(event) {
  if (document.querySelector('div:focus')) {
    captureData()
  }
  if (document.querySelector('.color-picker')) {
    const colorPicker = event.target
    colorPicker.closest('section').style.backgroundColor = colorPicker.value
  }
}

/** Handles input events targeting the search box.
 * @param {Object} event - event object recieved from the event listener
 */
function handleSearchInput(event) {
  filterTasks(event.target.value)
}

/**
 * Sends an HTTP request. Gets a string describing the type of request.
 * @param {String} req - the type of request to send
 */
async function handleRequest(req) {
  displayLoader()
  greyOutButtons(true)

  try {
    if (req === 'load') {
      await getRemoteData()
    }
    if (req === 'save') {
      await storeRemoteData()
    }
  } catch (error) {
    DisplayInfo(error)
  } finally {
    greyOutButtons(false)
    removeLoader()
  }
}

/** Handles click events targeting an option button.
 * Passes a request by checking the button's class name.
 * @param {Object} event - event object recieved from the event listener
 */
function handleOptionClick(event) {
  handleRequest(event.target.className)
}

/** ************** Drag & Drop Functions *************** */

mainContainer.addEventListener('dragstart', (event) => {
  if (event.target.className === 'task') {
    event.target.classList.add('dragging')
  }
})

mainContainer.addEventListener('dragend', (event) => {
  event.target.classList.remove('dragging')
})

/* used to disable the 'blocked' cursor icon */
document.addEventListener(
  'dragover',
  (event) => {
    event.preventDefault()
  },
  false
)

/**
 * Gets the section element, if it exist, from the path of a drop event.
 * @param {Object} event the event dispatched by the event listener
 * @returns {Element} - the section element from the event path
 */
function getSectionFromPath(event) {
  const sectionElement = event
    .composedPath()
    .filter((element) => element.tagName === 'SECTION')[0]
  return sectionElement
}

mainContainer.addEventListener('drop', (event) => {
  event.preventDefault()
  // move dragged task to the selected section
  const dragEl = document.querySelector('.dragging')
  const sectionList = getSectionFromPath(event).querySelector('ul')
  if (sectionList) {
    sectionList.insertBefore(dragEl, sectionList.firstChild)
    captureData()
  }
})

/** ************** Event Listeners *************** */

mainContainer.addEventListener('click', handleClick)

optionBox.addEventListener('click', handleOptionClick)

window.addEventListener('load', loadData)

window.addEventListener('keydown', handleKeyPress)

mainContainer.addEventListener('dblclick', handleDoubleClick)

mainContainer.addEventListener('focusout', handleFocusOut)

mainContainer.addEventListener('input', handleInput)

searchInput.addEventListener('input', handleSearchInput)
