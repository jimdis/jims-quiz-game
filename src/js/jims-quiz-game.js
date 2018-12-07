import API from './api.js'

const template = document.createElement('template')

template.innerHTML = /* html */`
<link rel="stylesheet" href="../css/jims-quiz-game.css">
<form action="">
<div id="startDiv" class="hidden">
<h4>Please enter a nickname:</h4>
<input type="text" name="playerName" id="inputName" autocomplete="off" placeholder="Your cool nickname here...">
</div>
<div id="questionDiv" class="hidden">
<p id="timerLabel">Timer: <span id="timer"></span></p>
<h4>Question:</h4>
<h3 id="question"></h3>
<h4>Your answer:</h4>
<input type='text' name="textAnswer" id='inputAnswer' class="hidden" autocomplete="off" placeholder="Type your answer here...">
<div id="radioButtons">
</div>
</div>
<div id="answerDiv" class="hidden">
<h3 id="serverAnswer"></h3>
<h4 id="customAnswer"></h4>
<h4 id="totalTime"></h4>
</div>
<div id="highScoreDiv">
<h3>High Score</h3>
<table id="highScoreTable">
<head>
<tr>
<th>Name</th>
<th>Time</th>
</tr>
</head>
<tbody>
</tbody>
</table>
</div>
<button id="formButton" type="submit">BOILERPLATE</button>
</form>
`

/**
 * A Quiz game component
 *
 * @class QuizGame
 * @extends {window.HTMLElement}
 */

class QuizGame extends window.HTMLElement {
  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

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

  disconnectedCallback () {
    this.setTimer('stop')
    this.form.removeEventListener('submit', this.boundButtonClicked)
    this.api = null
  }

  async buttonClicked (event) {
    event.preventDefault()
    if (this.gameState === 'start') {
      this.gameState = 'question'
      this.playerName = this.form.playerName.value
      this.question = await this.api.getQuestion()
      this._updateRendering()
      this.setTimer('start')
    } else if (this.gameState === 'question') {
      this.setTimer('stop')
      let answer = this.form.inputAnswer.value ? this.form.inputAnswer.value.toUpperCase().trim()
        : this.form.alt.value
      this.response = await this.api.sendAnswer(answer)
      if (this.api.wrongAnswer) {
        this.gameState = 'gameOver'
        this._updateRendering()
      } else if (this.api.gameFinished) {
        this.gameState = 'gameFinished'
        this.populateStorage()
        this._updateRendering()
      } else this.gameState = 'answer'
      this._updateRendering()
    } else if (this.gameState === 'answer') {
      this.gameState = 'question'
      this.question = await this.api.getQuestion()
      this._updateRendering()
      this.setTimer('start')
    } else if (this.gameState === 'gameOver' || this.gameState === 'gameFinished') {
      this.disconnectedCallback()
      this.connectedCallback()
    }
  }

  // Self-adjusting timer adapted from https://www.sitepoint.com/creating-accurate-timers-in-javascript/
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

  populateStorage () {
    let highScores = this.getHighScores()
    let worstHighScore = highScores[4][1]
    let worstPlayer = highScores[4][0]
    if (this.totalTime < worstHighScore) {
      window.localStorage.setItem(this.playerName, this.totalTime)
      window.localStorage.removeItem(worstPlayer)
    }
  }

  getHighScores () {
    let arr = []
    Object.keys(window.localStorage).forEach((key) => {
      arr.push([key, parseInt(window.localStorage.getItem(key), 10)])
    })
    arr.sort((a, b) => a[1] - b[1])
    return arr.slice(0, 5)
  }

  _updateRendering () {
    const $ = (selector, context = this.shadowRoot) => context.querySelector(selector)
    const hideElement = (selector) => $(selector).classList.add('hidden')
    const showElement = (selector) => $(selector).classList.remove('hidden')
    hideElement('#startDiv')
    hideElement('#questionDiv')
    hideElement('#answerDiv')
    hideElement('#inputAnswer')
    hideElement('#highScoreDiv')
    $('#radioButtons').textContent = null
    $('#inputName').required = false
    $('#inputAnswer').required = false

    if (this.gameState === 'start') {
      $('#inputName').value = null
      $('#inputName').required = true
      showElement('#startDiv')
      $('#inputName').focus()
    }

    if (this.gameState === 'question') {
      $('#question').textContent = this.question
      $('#inputAnswer').value = null
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
        })
        $('#radioButtons input').focus()
      } else {
        $('#inputAnswer').required = true
        showElement('#inputAnswer')
        $('#inputAnswer').focus()
      }
    }

    if (this.gameState === 'answer') {
      $('#customAnswer').textContent = null
      $('#totalTime').textContent = null
      $('#serverAnswer').textContent = this.response
      showElement('#answerDiv')
      $('button').textContent = 'Next Question!'
      $('button').focus()
    }

    if (this.gameState === 'gameOver') {
      if (this.timeOut) {
        $('#serverAnswer').textContent = null
        $('#customAnswer').textContent = 'Time is out! GAME OVER!'
      } else {
        $('#serverAnswer').textContent = this.response
        $('#customAnswer').textContent = 'GAME OVER!'
      }
      showElement('#answerDiv')
      $('button').textContent = 'Play Again!'
      $('button').focus()
    }

    if (this.gameState === 'gameFinished') {
      $('#serverAnswer').textContent = this.response
      $('#customAnswer').textContent = 'Congratulations! You passed the quiz!'
      $('#totalTime').textContent = `Your total time was ${this.totalTime / 1000} seconds`
      $('#highScoreTable tbody').textContent = null
      showElement('#answerDiv')
      showElement('#highScoreDiv')
      let highScores = this.getHighScores()
      for (let player of highScores) {
        let tr = document.createElement('tr')
        let tdName = document.createElement('td')
        let tdScore = document.createElement('td')
        tdName.textContent = player[0]
        tdScore.textContent = `${player[1] / 1000} seconds`
        tr.appendChild(tdName)
        tr.appendChild(tdScore)
        $('#highScoreTable tbody').appendChild(tr)
      }
      $('button').textContent = 'Play Again!'
      $('button').focus()
    }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
