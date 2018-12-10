import API from './api.js'
import templateHTML from './html.js'

const template = document.createElement('template')

template.innerHTML = templateHTML

/**
 * A Quiz game component
 *
 * @class QuizGame
 * @extends {window.HTMLElement}
 */

class QuizGame extends window.HTMLElement {
  /**
   * Creates an instance of QuizGame.
   * @memberof QuizGame
   */
  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  /**
   * Called when connected to the DOM
   *
   * @memberof QuizGame
   */
  connectedCallback () {
    this.api = new API()
    this.totalTime = 0
    this.gameState = 'start'
    this.form = this.shadowRoot.querySelector('form')
    this.form.querySelector('button').textContent = 'Start Game!'
    // save reference so the event listener can be removed
    this.boundButtonClicked = this.buttonClicked.bind(this)
    this.form.addEventListener('submit', this.boundButtonClicked)
    this._updateRendering()
  }

  /**
   * Called when removed from the DOM.
   *
   * @memberof QuizGame
   */
  disconnectedCallback () {
    this.setTimer('stop')
    this.form.removeEventListener('submit', this.boundButtonClicked)
    this.api = null // Garbage collection
    this.errorMessage = null
  }

  /**
   * Game logic for what happens when user clicks button
   *
   * @param {any} event
   * @memberof QuizGame
   */
  async buttonClicked (event) {
    event.preventDefault()
    if (this.gameState === 'start') {
      this.playerName = this.form.playerName.value
      this.gameState = 'answer'
    }
    if (this.gameState === 'answer') {
      this.question = await this.api.getQuestion()
        .catch((error) => { this.errorMessage = error })
      if (this.errorMessage) {
        this.gameState = 'error'
        this._updateRendering()
        this.gameState = 'restart'
      } else {
        this.gameState = 'question'
        this._updateRendering()
        this.setTimer('start')
      }
    } else if (this.gameState === 'question') {
      this.setTimer('stop')
      let answer = this.api.alternatives
        ? this.shadowRoot.querySelector('input[name="alt"]:checked').value
        : this.form.inputAnswer.value.toUpperCase().trim()
      this.form.reset()
      this.response = await this.api.sendAnswer(answer)
        .catch((error) => { this.errorMessage = error })
      if (this.errorMessage) {
        this.gameState = 'error'
        this._updateRendering()
        this.gameState = 'restart'
      } else if (this.api.wrongAnswer) {
        this.gameState = 'gameOver'
        this._updateRendering()
        this.gameState = 'restart'
      } else if (this.api.gameFinished) {
        this.gameState = 'gameFinished'
        this.populateStorage()
        this._updateRendering()
        this.gameState = 'restart'
      } else {
        this.gameState = 'answer'
        this._updateRendering()
      }
    } else if (this.gameState === 'restart') {
      this.disconnectedCallback()
      this.connectedCallback()
    }
  }

  /**
   * Timer adapted from https://www.sitepoint.com/creating-accurate-timers-in-javascript/
   * Counts down from 20s each question. Total Time for the quiz is stored in this.totalTime
   *
   * @param {string} action 'start' or 'stop'
   * @memberof QuizGame
   */
  setTimer (action) {
    if (action === 'start') {
      this.timer = 0
      var start = new Date().getTime()
      var elapsed = '20.0'
      this.shadowRoot.querySelector('#timer').classList.remove('fiveseconds')
      timer.call(this)
    }
    function timer () {
      this.timer += 100
      elapsed = Math.floor(200 - (this.timer / 100)) / 10
      if (Math.round(elapsed) === elapsed) { elapsed += '.0' }
      let diff = (new Date().getTime() - start) - this.timer
      this.shadowRoot.querySelector('#timer').textContent = elapsed
      if (elapsed === '5.0') {
        this.shadowRoot.querySelector('#timer').classList.add('fiveseconds')
      }
      if (elapsed === '0.0') {
        this.setTimer('stop')
        this.gameState = 'gameOver'
        this.timeOut = true
        this._updateRendering()
      } else {
        this.timerID = setTimeout(timer.bind(this), (100 - diff))
      }
    }
    if (action === 'stop') {
      clearTimeout(this.timerID)
      this.totalTime += this.timer
    }
  }

  /**
   * Populates localStorage if player's time is better than the 5th best stored time.
   * Removes the localStorage item that had the previous 5th best stored time.
   *
   * @memberof QuizGame
   */
  populateStorage () {
    let date = new Date().toISOString().substring(0, 10)
    let key = `jqg-${new Date().valueOf()}`
    let value = {
      'key': key,
      'name': this.playerName,
      'time': this.totalTime,
      'date': date
    }
    let highScores = this.getHighScores()

    if (highScores.length < 5) {
      window.localStorage.setItem(key, JSON.stringify(value))
    } else {
      let worstHighScore = highScores[4].time
      let worstPlayer = highScores[4].key
      if (this.totalTime < worstHighScore) {
        window.localStorage.setItem(key, JSON.stringify(value))
        window.localStorage.removeItem(worstPlayer)
      }
    }
  }

  /**
   * Checks the localStorage for specific identifier key and returns the five best times.
   *
   * @memberof QuizGame
   * @returns {Array} Array with objects containing key, name, date, time
   */
  getHighScores () {
    let arr = []
    let keys = Object.keys(window.localStorage).filter(key => key.substr(0, 4) === 'jqg-')
    keys.forEach((key) => {
      arr.push(JSON.parse(window.localStorage.getItem(key)))
    })
    arr.sort((a, b) => a.time - b.time)
    return arr.slice(0, 5)
  }

  /**
   * Updates rendering of browser window with relevant content depending on game state.
   *
   * @memberof QuizGame
   */
  _updateRendering () {
    const $ = (selector, context = this.shadowRoot) => context.querySelector(selector)
    const showElement = (selector) => $(selector).classList.remove('hidden')
    let divs = this.shadowRoot.querySelectorAll('form div')
    for (let div of divs) {
      div.classList.add('hidden')
    }
    $('#radioButtons').textContent = null
    $('#inputName').required = false
    $('#inputAnswer').required = false
    if (this.gameState === 'start') {
      $('#inputName').required = true
      showElement('#startDiv')
      $('#inputName').focus()
    }
    if (this.gameState === 'question') {
      $('#question').textContent = this.question
      showElement('#questionDiv')
      $('button').textContent = 'Submit Answer!'
      if (this.api.alternatives) {
        Object.keys(this.api.alternatives).forEach((key) => {
          let label = document.createElement('label')
          let radioButton = document.createElement('input')
          let text = document.createTextNode(this.api.alternatives[key])
          radioButton.name = 'alt'
          radioButton.type = 'radio'
          radioButton.value = key
          radioButton.required = true
          label.appendChild(radioButton)
          label.appendChild(text)
          $('#radioButtons').appendChild(label)
          showElement('#radioButtons')
          showElement('#inputRadio')
        })
        $('#radioButtons input').focus()
      } else {
        $('#inputAnswer').required = true
        showElement('#inputText')
        $('#inputAnswer').focus()
      }
    }
    if (this.gameState === 'answer') {
      $('#serverAnswer').textContent = this.response
      showElement('#answerDiv')
      $('button').textContent = 'Next Question!'
      $('button').focus()
    }
    if (this.gameState === 'gameOver') {
      if (this.timeOut) {
        showElement('#timeOut')
      } else {
        $('#serverAnswer').textContent = this.response
        showElement('#answerDiv')
        showElement('#gameOver')
      }
      $('button').textContent = 'Play Again!'
      $('button').focus()
    }
    if (this.gameState === 'gameFinished') {
      $('#serverAnswer').textContent = this.response
      $('#totalTime').textContent = `Your total time was ${this.totalTime / 1000} seconds`
      $('#highScoreTable').textContent = null
      let highScores = this.getHighScores()
      for (let player of highScores) {
        let tr = document.createElement('tr')
        let tdPlace = document.createElement('td')
        let tdDate = document.createElement('td')
        let tdName = document.createElement('td')
        let tdScore = document.createElement('td')
        tdPlace.textContent = highScores.indexOf(player) + 1
        tdName.textContent = player.name
        tdScore.textContent = `${player.time / 1000} seconds`
        tdDate.textContent = player.date
        tr.appendChild(tdPlace)
        tr.appendChild(tdDate)
        tr.appendChild(tdName)
        tr.appendChild(tdScore)
        $('#highScoreTable').appendChild(tr)
      }
      showElement('#answerDiv')
      showElement('#gameFinished')
      $('button').textContent = 'Play Again!'
      $('button').focus()
    }
    if (this.gameState === 'error') {
      showElement('#error')
      $('#errorMessage').textContent = this.errorMessage
      $('button').textContent = 'Try Again?'
      $('button').focus()
    }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
