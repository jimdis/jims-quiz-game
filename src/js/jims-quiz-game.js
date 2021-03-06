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
    this._boundButtonClicked = this._buttonClicked.bind(this)
    this.form.addEventListener('submit', this._boundButtonClicked)
    this._updateRendering()
  }

  /**
   * Called when removed from the DOM.
   *
   * @memberof QuizGame
   */
  disconnectedCallback () {
    this._setTimer('stop')
    this.form.removeEventListener('submit', this._boundButtonClicked)
    this.api = null // Garbage collection
  }

  /**
   * Game logic for what happens when user clicks button
   *
   * @param {any} event
   * @memberof QuizGame
   */
  async _buttonClicked (event) {
    event.preventDefault()
    // Start of game after user inputs name
    if (this.gameState === 'start') {
      this.playerName = this.form.playerName.value
      this.gameState = 'answer'
    }
    // User is presented question and prompted for an answer
    if (this.gameState === 'answer') {
      this.question = await this.api.getQuestion()
        .catch((error) => { this.errorMessage = error })
      if (this.errorMessage) {
        this.gameState = 'error'
        this._updateRendering()
        this.gameState = 'restart'
        this.errorMessage = null
      } else {
        this.gameState = 'question'
        this._updateRendering()
        this._setTimer('start')
      }
    // User has answered question
    } else if (this.gameState === 'question') {
      this._setTimer('stop')
      let answer = this.api.alternatives
        ? this.shadowRoot.querySelector('input[name="alt"]:checked').value
        : this.form.inputAnswer.value.toUpperCase().trim()
      this.form.reset()
      this.response = await this.api.sendAnswer(answer)
        .catch((error) => { this.errorMessage = error })
      // Checks if error, wrong answer or final questions
      if (this.errorMessage) {
        this.gameState = 'error'
        this._updateRendering()
        this.gameState = 'restart'
        this.errorMessage = null
      } else if (this.api.wrongAnswer) {
        this.gameState = 'gameOver'
        this._updateRendering()
        this.gameState = 'restart'
      } else if (this.api.gameFinished) {
        this.gameState = 'gameFinished'
        this._populateStorage()
        this._updateRendering()
        this.gameState = 'restart'
      } else {
        this.gameState = 'answer'
        this._updateRendering()
      }
    // User has chosen to restart game
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
  _setTimer (action) {
    if (action === 'start') {
      this.timer = 0
      var start = new Date().getTime()
      var elapsed = '20.0'
      this.shadowRoot.querySelector('#timer').classList.remove('fiveseconds')
      timerCycle.call(this)
    }
    function timerCycle () {
      this.timer += 100
      elapsed = Math.floor(200 - (this.timer / 100)) / 10
      if (Math.round(elapsed) === elapsed) { elapsed += '.0' }
      let diff = (new Date().getTime() - start) - this.timer
      this.shadowRoot.querySelector('#timer').textContent = elapsed
      if (elapsed === '5.0') {
        this.shadowRoot.querySelector('#timer').classList.add('fiveseconds')
      }
      if (elapsed === '0.0') {
        this._setTimer('stop')
        this.gameState = 'gameOver'
        this.timeOut = true
        this._updateRendering()
        this.gameState = 'restart'
        this.timeOut = false
      } else {
        this.timerID = setTimeout(timerCycle.bind(this), (100 - diff))
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
  _populateStorage () {
    let date = new Date().toISOString().substring(0, 10)
    let key = `jqg-${new Date().valueOf()}` // game identifier + unique id
    let value = {
      'key': key,
      'name': this.playerName,
      'time': this.totalTime,
      'date': date
    }
    let highScores = this._getHighScores()

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
  _getHighScores () {
    let arr = []
    Object.keys(window.localStorage)
      .filter(key => key.substr(0, 4) === 'jqg-')
      .forEach((key) => arr.push(JSON.parse(window.localStorage.getItem(key))))

    return arr.sort((a, b) => a.time - b.time)
      .slice(0, 5)
  }

  /**
   * Updates rendering of browser window with relevant content depending on game state.
   *
   * @memberof QuizGame
   */
  _updateRendering () {
    // Making it easier to select and show elements
    const $ = (selector) => this.shadowRoot.querySelector(selector)
    const showElement = (selector) => $(selector).classList.remove('hidden')
    // Hides all div elements
    let divs = this.shadowRoot.querySelectorAll('form div')
    divs.forEach(div => div.classList.add('hidden'))
    // Housekeeping
    $('#radioButtons').textContent = null
    $('#inputName').required = false
    $('#inputAnswer').required = false
    // Start of game: User is prompted for name
    if (this.gameState === 'start') {
      $('#inputName').required = true
      showElement('#startDiv')
      $('#inputName').focus()
    }
    // User is presented with question and prompted for answer
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
    // User is presented with response message from server after having sent answer
    if (this.gameState === 'answer') {
      $('#serverAnswer').textContent = this.response
      showElement('#answerDiv')
      $('button').textContent = 'Next Question!'
      $('button').focus()
    }
    // User is presented with game over and prompted to play again.
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
    // User is presented with game finished and highscores and prompted to play again.
    if (this.gameState === 'gameFinished') {
      $('#serverAnswer').textContent = this.response
      $('#totalTime').textContent = `Your total time was ${this.totalTime / 1000} seconds`
      $('#highScoreTable').textContent = null
      let highScores = this._getHighScores()
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
        // Highligts player name if in highscore list
        if (player.name === this.playerName && player.time === this.totalTime) {
          tr.id = 'highlight'
        }
        $('#highScoreTable').appendChild(tr)
      }
      showElement('#answerDiv')
      showElement('#gameFinished')
      $('button').textContent = 'Play Again!'
      $('button').focus()
    }
    // User is presented with error message and prompted to try again
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
