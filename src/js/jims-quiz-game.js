// import Timer from './Timer.js'
const template = document.createElement('template')
template.innerHTML = /* html */`
<!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
-->
<style>
  :host {
    display: block;
    width: 100%;
    margin: 10px 0 10px;
    border: 1px solid grey;
    background-color: #f6f7f7;
    font-family: "Lucida Grande", sans-serif;
    -webkit-font-smoothing: antialiased;
    font-size: 100%;
    color: #313638;
    line-height: 1.5;
  }
  :host([hidden]) {
        display: none;
      }
  h2,
  h3,
  h4 {
    font-family: "Palatino Linotype", "Book Antiqua", "Palatino", serif;
    text-align: center;
    color: #FF6B6B;
    font-weight: normal;
    font-size: 1.5em;
    margin: 10px;
  }
  label {
    display: block;
  }
  input[type=text],
  select {
    width: 70%;
    font-size: 1em;
    padding: 8px;
    margin: 8px auto 16px;
    display: block;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }
  input[type=radio] {
    margin-right: 10px;
  }
  button {
    display: block;
    width: 70%;
    font-size: 1em;
    background-color: #FF6B6B;
    color: white;
    padding: 14px 20px;
    margin: 8px auto;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background-color: #ff4c4c;
}
  .hidden {
    display: none;
  }
</style>
<div id="startDiv">
<h4>Please enter a nickname:</h4>
<input type="text" id="input-name" autofocus placeholder="Your cool nickname here...">
<button id="buttonStart">Start Game!</button>
</div>
<div id="questionDiv" class="hidden">
<h4>Timer: <span id="timer"></span></h4>
<h3 id="question"></h3>
<h4>Your answer:</h4>
<div id="inputDiv">
</div>
<button id="buttonAnswer">Send Answer</button>
</div>
<div id="answerDiv" class="hidden">
<h3 id="serverAnswer"></h3>
<p id="customAnswer"></p>
<p id="totalTime"></p>
<button id="buttonRestart" class="hidden">Restart Game!</button>
<button id="buttonGetQuestion">Next Question!</button>
</div>
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
    this.gameOver = false
    this.shadowRoot.querySelector('#buttonStart').addEventListener('click', () => {
      this.playerName = this.shadowRoot.querySelector('#input-name').value
      this.getQuestion()
    }, { once: true }
    )
    // Save refer so we can remove listener later.
    this.boundSendAnswer = this.sendAnswer.bind(this)
    this.boundGetQuestion = this.getQuestion.bind(this)

    this.shadowRoot.querySelector('#buttonAnswer').addEventListener('click', this.boundSendAnswer)
    this.shadowRoot.querySelector('#buttonGetQuestion').addEventListener('click', this.boundGetQuestion)
    this.shadowRoot.querySelector('#buttonRestart').addEventListener('click', this.restartGame.bind(this), { once: true })
    this._updateRendering()
  }

  disconnectedCallback () {
    this.shadowRoot.querySelector('#buttonAnswer').removeEventListener('click', this.boundSendAnswer)
    this.shadowRoot.querySelector('#buttonGetQuestion').removeEventListener('click', this.boundGetQuestion)
  }

  async sendAnswer () {
    this.stopTimer()
    let answer = this.getAnswer()
    this.response = await this.postData(this.apiURL, { answer: answer })
    this.apiURL = this.response.nextURL ? this.response.nextURL : null
    this._updateRendering()
  }

  restartGame () {
    this.stopTimer()
    this.disconnectedCallback()
    this.connectedCallback()
  }

  startTimer () {
    this.timer = 0
    let start = new Date().getTime()
    let elapsed = '20.0'
    timer.call(this)

    function timer () {
      this.timer += 100
      elapsed = Math.floor(200 - (this.timer / 100)) / 10
      if (Math.round(elapsed) === elapsed) { elapsed += '.0' }
      let diff = (new Date().getTime() - start) - this.timer
      this.shadowRoot.querySelector('#timer').textContent = elapsed
      if (elapsed === '0.0') {
        this.stopTimer()
        this.gameOver = true
        this._updateRendering()
      } else {
        this.timerID = setTimeout(timer.bind(this), (100 - diff))
      }
    }
  }

  stopTimer () {
    clearTimeout(this.timerID)
    this.totalTime += this.timer
    console.log('Total time is: ' + this.totalTime)
    console.log('TIMER STOPPED at: ' + this.timer)
  }

  // query (selector) {
  //   return this.shadowRoot.querySelector(selector)
  // }

  async getQuestion () {
    let response = await window.fetch(this.apiURL)
    this.response = await response.json()
    this.apiURL = this.response.nextURL
    this._updateRendering()
    this.startTimer()
  }

  getAnswer () {
    let answer
    if (this.response.alternatives) {
      let alternatives = this.shadowRoot.querySelectorAll('[type=radio]')
      for (let alternative of Array.from(alternatives)) {
        if (alternative.checked) {
          answer = alternative.value
        }
      }
    } else {
      let input = this.shadowRoot.querySelector('#inputText')
      answer = input.value
    }
    return answer
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
      this.gameOver = true
    }
    response = await response.json()
    return response
  }

  populateStorage () {
    let worstHighScore = 0
    Object.keys(window.localStorage).forEach((key) => {
      let score = parseInt(window.localStorage.getItem(key), 10)
      if (score >= worstHighScore) {
        worstHighScore = score
      }
    })
    if (this.totalTime <= worstHighScore || window.localStorage.length < 5) {
      window.localStorage.setItem(this.playerName, this.totalTime)
    }
  }

  getHighScores () {
    console.log('Highscores:')
    Object.keys(window.localStorage).forEach((key) => {
      console.log(`Name: ${key}, Time: ${window.localStorage.getItem(key)}`)
    })
  }

  showElement (element) {
    if (element.classList.contains('hidden')) {
      element.classList.remove('hidden')
    }
  }

  hideElement (element) {
    if (!element.classList.contains('hidden')) {
      element.classList.add('hidden')
    }
  }

  _updateRendering () {
    let startDiv = this.shadowRoot.querySelector('#startDiv')
    let questionDiv = this.shadowRoot.querySelector('#questionDiv')
    let answerDiv = this.shadowRoot.querySelector('#answerDiv')
    let question = this.shadowRoot.querySelector('#question')
    let serverAnswer = this.shadowRoot.querySelector('#serverAnswer')
    let customAnswer = this.shadowRoot.querySelector('#customAnswer')
    let totalTime = this.shadowRoot.querySelector('#totalTime')
    let div = this.shadowRoot.querySelector('#inputDiv')
    let buttonGetQuestion = this.shadowRoot.querySelector('#buttonGetQuestion')
    let buttonRestart = this.shadowRoot.querySelector('#buttonRestart')
    div.innerHTML = ''
    customAnswer.textContent = ''
    totalTime.textContent = ''
    this.hideElement(startDiv)
    if (!this.response) {
      this.hideElement(answerDiv)
      this.showElement(startDiv)
    } else if (this.gameOver) {
      this.hideElement(questionDiv)
      this.showElement(answerDiv)
      this.hideElement(buttonGetQuestion)
      this.showElement(buttonRestart)
      serverAnswer.textContent = this.response.message
      customAnswer.textContent = 'GAME OVER!'
    } else if (!this.apiURL) {
      this.hideElement(questionDiv)
      this.showElement(answerDiv)
      this.hideElement(buttonGetQuestion)
      this.showElement(buttonRestart)
      customAnswer.textContent = 'Congratulations! You passed the quiz!'
      totalTime.textContent = `Your Total Time: ${this.totalTime / 1000} seconds`
      this.populateStorage()
    } else if (!this.response.question) {
      this.hideElement(questionDiv)
      this.hideElement(buttonRestart)
      this.showElement(buttonGetQuestion)
      this.showElement(answerDiv)
      serverAnswer.textContent = this.response.message
    } else if (this.response.question && !this.response.alternatives) {
      this.hideElement(answerDiv)
      this.showElement(questionDiv)
      question.textContent = this.response.question
      let input = document.createElement('input')
      input.setAttribute('type', 'text')
      input.setAttribute('id', 'inputText')
      div.appendChild(input)
    } else if (this.response.alternatives) {
      this.hideElement(answerDiv)
      this.showElement(questionDiv)
      question.textContent = this.response.question
      Object.keys(this.response.alternatives).forEach((key) => {
        let label = document.createElement('label')
        let radioButton = document.createElement('input')
        let text = document.createTextNode(this.response.alternatives[key])
        radioButton.setAttribute('name', 'alt')
        radioButton.setAttribute('type', 'radio')
        radioButton.setAttribute('value', key)
        label.appendChild(radioButton)
        label.appendChild(text)
        div.appendChild(label)
      })
    }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
