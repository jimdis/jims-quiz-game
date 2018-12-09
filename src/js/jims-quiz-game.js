import API from './api.js'

const template = document.createElement('template')

template.innerHTML = /* html */`
<link rel="stylesheet" href="../css/jims-quiz-game.css">
<form action="">
    <div id="startDiv">
        <h4>Please enter a nickname:</h4>
        <input type="text" name="playerName" id="inputName" autocomplete="off" placeholder="Your cool nickname here...">
    </div>
    <div id="questionDiv">
        <p id="timerLabel">Timer: <span id="timer"></span></p>
        <h4>Question:</h4>
        <h3 id="question"></h3>
        <h4>Your answer:</h4>
    </div>
    <div id="inputText">
      <input type="text" name="textAnswer" id="inputAnswer" autocomplete="off" placeholder="Type your answer here...">
    </div>
    <div id="inputRadio">
        <div id="radioButtons">
        </div>
    </div>
    <div id="answerDiv">
        <h3 id="serverAnswer"></h3>
    </div>
    <div id="gameOver">
        <h4>GAME OVER!</h4>
    </div>
    <div id="gameFinished">
        <h4>Congratulations! You passed the quiz!</h4>
        <h4 id="totalTime"></h4>
        <h3>High Score</h3>
        <table>
                <tr>
                    <th>Place</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Time</th>
                </tr>
            <tbody  id="highScoreTable">
            </tbody>
        </table>
    </div>

    <div id="timeOut">
        <h4>Time is out! Game Over!</h4>
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
      console.log(this.shadowRoot.querySelector('input[name="alt"]:checked'))
      let answer = this.api.alternatives
        ? this.shadowRoot.querySelector('input[name="alt"]:checked').value
        : this.form.inputAnswer.value.toUpperCase().trim()
      this.form.reset()
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

  getHighScores () {
    let arr = []
    let keys = Object.keys(window.localStorage).filter(key => key.substr(0, 4) === 'jqg-')
    keys.forEach((key) => {
      arr.push(JSON.parse(window.localStorage.getItem(key)))
    })
    arr.sort((a, b) => a.time - b.time)
    console.log(arr)
    return arr.slice(0, 5)
  }

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
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
