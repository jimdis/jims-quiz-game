const template = document.createElement('template')

template.innerHTML = /* html */`
<link rel="stylesheet" href="../css/jims-quiz-game.css">
<form action="">
<div id="startDiv" class="hidden">
<h4>Please enter a nickname:</h4>
<input type="text" name="playerName" id="inputName" autocomplete="off" placeholder="Your cool nickname here...">
</div>
<div id="questionDiv" class="hidden">
<h4>Timer: <span id="timer"></span></h4>
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
    this.totalTime = 0
    this.apiURL = 'http://vhost3.lnu.se:20080/question/1'
    this.response = null
    this.gameState = 'start'

    let form = this.shadowRoot.querySelector('form')
    form.querySelector('button').textContent = 'Start Game!'
    form.addEventListener('submit', event => {
      this.buttonClicked(form)
      event.preventDefault()
    })

    this._updateRendering()
  }

  disconnectedCallback () {
    this.setTimer('stop')
    this.shadowRoot.querySelector('form').removeEventListener('submit')
  }

  buttonClicked (form) {
    if (this.gameState === 'start') {
      this.gameState = 'question'
      this.playerName = form.playerName.value
      this.getQuestion()
    } else if (this.gameState === 'question') {
      this.gameState = 'answer'
      this.sendAnswer(form)
    } else if (this.gameState === 'answer') {
      this.gameState = 'question'
      this.getQuestion()
    } else if (this.gameState === 'gameOver' || this.gameState === 'gameFinished') {
      this.disconnectedCallback()
      this.connectedCallback()
    }
  }

  async getQuestion () {
    let response = await window.fetch(this.apiURL)
    this.response = await response.json()
    this.apiURL = this.response.nextURL
    this._updateRendering()
    this.setTimer('start')
  }

  async sendAnswer (form) {
    this.setTimer('stop')
    let answer = form.inputAnswer.value ? form.inputAnswer.value : form.alt.value
    this.response = await this.postData(this.apiURL, { answer: answer })
    if (!this.response.nextURL && this.gameState !== 'gameOver') {
      this.apiURL = null
      this.gameState = 'gameFinished'
      this.populateStorage()
    } else {
      this.apiURL = this.response.nextURL
    }
    this._updateRendering()
  }

  async postData (url, data) {
    let response = await window.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    if (response.status === 400) {
      this.gameState = 'gameOver'
    }
    response = await response.json()
    return response
  }

  setTimer (action) {
    if (action === 'start') {
      this.timer = 0
      var start = new Date().getTime()
      var elapsed = '20.0'
      timer.call(this)
    }

    function timer () {
      this.timer += 100
      elapsed = Math.floor(200 - (this.timer / 100)) / 10
      if (Math.round(elapsed) === elapsed) { elapsed += '.0' }
      let diff = (new Date().getTime() - start) - this.timer
      this.shadowRoot.querySelector('#timer').textContent = elapsed
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
      $('#inputName').required = true
      showElement('#startDiv')
      $('#inputName').focus()
    }

    if (this.gameState === 'question') {
      $('#question').textContent = this.response.question
      showElement('#questionDiv')
      $('button').textContent = 'Submit Answer!'
      if (this.response.alternatives) {
        $('#inputAnswer').value = null
        Object.keys(this.response.alternatives).forEach((key) => {
          let label = document.createElement('label')
          let radioButton = document.createElement('input')
          let text = document.createTextNode(this.response.alternatives[key])
          radioButton.name = 'alt'
          radioButton.type = 'radio'
          radioButton.value = key
          radioButton.required = true
          label.appendChild(radioButton)
          label.appendChild(text)
          $('#radioButtons').appendChild(label)
          showElement('#radioButtons')
        })
      } else {
        $('#inputAnswer').required = true
        showElement('#inputAnswer')
        $('#inputAnswer').focus()
      }
    }

    if (this.gameState === 'answer') {
      $('#serverAnswer').textContent = this.response.message
      showElement('#answerDiv')
      $('button').textContent = 'Next Question!'
      $('button').focus()
    }

    if (this.gameState === 'gameOver') {
      if (this.timeOut) {
        $('#serverAnswer').textContent = null
        $('#customAnswer').textContent = 'Time is out! GAME OVER!'
      } else {
        $('#serverAnswer').textContent = this.response.message
        $('#customAnswer').textContent = 'GAME OVER!'
      }
      showElement('#answerDiv')
      $('button').textContent = 'Play Again!'
    }

    if (this.gameState === 'gameFinished') {
      $('#serverAnswer').textContent = this.response.message
      $('#customAnswer').textContent = 'Congratulations! You passed the quiz!'
      $('#totalTime').textContent = `Your total time was ${this.totalTime / 1000} seconds`
      showElement('#answerDiv')
      showElement('#highScoreDiv')
      let highScores = this.getHighScores()
      for (let player of highScores) {
        let tr = document.createElement('tr')
        let tdName = document.createElement('td')
        let tdScore = document.createElement('td')
        tdName.textContent = player[0]
        tdScore.textContent = `${Math.floor(player[1] / 100) / 10} seconds`
        tr.appendChild(tdName)
        tr.appendChild(tdScore)
        $('#highScoreTable tbody').appendChild(tr)
      }
      $('button').textContent = 'Play Again!'
    }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
