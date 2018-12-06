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
  .hidden,
  div .hidden {
    display: none;
  }
  table {
    width: 70%;
    margin: 20px auto;
    border-collapse: collapse;
    text-align: left;
}

th,
td {
    padding: 10px;
}

th {
    background-color: #FF6B6B;
    color: #fff;
}

td:nth-child(1) {
    color: #FF6B6B;
}

</style>
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
    this.gameOver = false
    this.gameState = 'start'
    // this.shadowRoot.querySelector('#buttonStart').addEventListener('click', () => {
    //   this.playerName = this.shadowRoot.querySelector('#inputName').value
    //   this.getQuestion()
    // }, { once: true }
    // )
    // Save refer so we can remove listener later.
    // this.boundSendAnswer = this.sendAnswer.bind(this)
    // this.boundGetQuestion = this.getQuestion.bind(this)

    // this.shadowRoot.querySelector('#buttonAnswer').addEventListener('click', this.boundSendAnswer)
    // this.shadowRoot.querySelector('#buttonGetQuestion').addEventListener('click', this.boundGetQuestion)
    // this.shadowRoot.querySelector('#buttonRestart').addEventListener('click', this.restartGame.bind(this), { once: true })
    let form = this.shadowRoot.querySelector('form')
    form.querySelector('button').textContent = 'Start Game!'
    form.addEventListener('submit', event => {
      this.buttonClicked(form)
      event.preventDefault()
    })
    this._updateRendering()
  }

  disconnectedCallback () {
    this.shadowRoot.querySelector('#buttonAnswer').removeEventListener('click', this.boundSendAnswer)
    this.shadowRoot.querySelector('#buttonGetQuestion').removeEventListener('click', this.boundGetQuestion)
  }

  buttonClicked (form) {
    if (this.gameState === 'start') {
      this.gameState = 'question'
      this.playerName = form.playerName.value
      console.log(this.playerName)
      this.getQuestion()
    } else if (this.gameState === 'question') {
      this.gameState = 'answer'
      this.sendAnswer(form)
    } else if (this.gameState === 'answer') {
      this.gameState = 'question'
      this.getQuestion()
    } else if (this.gameState === 'gameOver' || this.gameState === 'gameFinished') {
      this.stopTimer()
      this.disconnectedCallback()
      this.connectedCallback()
    }
  }

  async getQuestion () {
    let response = await window.fetch(this.apiURL)
    this.response = await response.json()
    this.apiURL = this.response.nextURL
    this._updateRendering()
    this.startTimer()
  }

  async sendAnswer (form) {
    this.stopTimer()
    let answer = form.inputAnswer.value ? form.inputAnswer.value : form.alt.value
    console.log(answer)
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
        this.gameState = 'gameOver'
        this.timeOut = true
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

  // getAnswer () {
  //   let answer
  //   if (this.response.alternatives) {
  //     let alternatives = this.shadowRoot.querySelectorAll('[type=radio]')
  //     for (let alternative of Array.from(alternatives)) {
  //       if (alternative.checked) {
  //         answer = alternative.value
  //       }
  //     }
  //   } else {
  //     let input = this.shadowRoot.querySelector('#inputText')
  //     answer = input.value
  //   }
  //   return answer
  // }

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
    const $ = (selector, context = this.shadowRoot) => context.querySelector(selector)
    this.hideElement($('#startDiv'))
    this.hideElement($('#questionDiv'))
    this.hideElement($('#answerDiv'))
    this.hideElement($('#inputAnswer'))
    this.hideElement($('#highScoreDiv'))
    $('#radioButtons').textContent = null
    $('#inputName').required = false
    $('#inputAnswer').required = false

    if (this.gameState === 'start') {
      $('#inputName').required = true
      this.showElement($('#startDiv'))
      $('#inputName').focus()
    }

    if (this.gameState === 'question') {
      $('#question').textContent = this.response.question
      this.showElement($('#questionDiv'))
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
          this.showElement($('#radioButtons'))
        })
      } else {
        $('#inputAnswer').required = true
        this.showElement($('#inputAnswer'))
        $('#inputAnswer').focus()
      }
    }

    if (this.gameState === 'answer') {
      $('#serverAnswer').textContent = this.response.message
      this.showElement($('#answerDiv'))
      $('button').textContent = 'Next Question!'
      $('button').focus()
    }

    if (this.gameState === 'gameOver') {
      if (this.timeOut) {
        $('#customAnswer').textContent = 'Time is out! GAME OVER!'
      } else {
        $('#serverAnswer').textContent = this.response.message
        $('#customAnswer').textContent = 'GAME OVER!'
      }
      this.showElement($('#answerDiv'))
      $('button').textContent = 'Play Again!'
    }

    if (this.gameState === 'gameFinished') {
      $('#serverAnswer').textContent = this.response.message
      $('#customAnswer').textContent = 'Congratulations! You passed the quiz!'
      $('#totalTime').textContent = `Your total time was ${this.totalTime / 1000} seconds`
      this.showElement($('#answerDiv'))
      this.showElement($('#highScoreDiv'))
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

    // else if ()

    // let startDiv = this.shadowRoot.querySelector('#startDiv')
    // let questionDiv = this.shadowRoot.querySelector('#questionDiv')
    // let answerDiv = this.shadowRoot.querySelector('#answerDiv')
    // let question = this.shadowRoot.querySelector('#question')
    // let serverAnswer = this.shadowRoot.querySelector('#serverAnswer')
    // let customAnswer = this.shadowRoot.querySelector('#customAnswer')
    // let totalTime = this.shadowRoot.querySelector('#totalTime')
    // let div = this.shadowRoot.querySelector('#inputDiv')
    // let buttonGetQuestion = this.shadowRoot.querySelector('#buttonGetQuestion')
    // let buttonRestart = this.shadowRoot.querySelector('#buttonRestart')
    // div.innerHTML = ''
    // customAnswer.textContent = ''
    // totalTime.textContent = ''
    // this.hideElement(startDiv)
    // if (!this.response) {
    //   this.hideElement(answerDiv)
    //   this.showElement(startDiv)
    // } else if (this.gameOver) {
    //   this.hideElement(questionDiv)
    //   this.showElement(answerDiv)
    //   this.hideElement(buttonGetQuestion)
    //   this.showElement(buttonRestart)
    //   serverAnswer.textContent = this.response.message
    //   customAnswer.textContent = 'GAME OVER!'
    // } else if (!this.apiURL) {
    //   this.hideElement(questionDiv)
    //   this.showElement(answerDiv)
    //   this.hideElement(buttonGetQuestion)
    //   this.showElement(buttonRestart)
    //   customAnswer.textContent = 'Congratulations! You passed the quiz!'
    //   totalTime.textContent = `Your Total Time: ${this.totalTime / 1000} seconds`
    //   this.populateStorage()
    // } else if (!this.response.question) {
    //   this.hideElement(questionDiv)
    //   this.hideElement(buttonRestart)
    //   this.showElement(buttonGetQuestion)
    //   this.showElement(answerDiv)
    //   serverAnswer.textContent = this.response.message
    // } else if (this.response.question && !this.response.alternatives) {
    //   this.hideElement(answerDiv)
    //   this.showElement(questionDiv)
    //   question.textContent = this.response.question
    //   let input = document.createElement('input')
    //   input.setAttribute('type', 'text')
    //   input.setAttribute('id', 'inputText')
    //   div.appendChild(input)
    // } else if (this.response.alternatives) {
    //   this.hideElement(answerDiv)
    //   this.showElement(questionDiv)
    //   question.textContent = this.response.question
    //   Object.keys(this.response.alternatives).forEach((key) => {
    //     let label = document.createElement('label')
    //     let radioButton = document.createElement('input')
    //     let text = document.createTextNode(this.response.alternatives[key])
    //     radioButton.setAttribute('name', 'alt')
    //     radioButton.setAttribute('type', 'radio')
    //     radioButton.setAttribute('value', key)
    //     label.appendChild(radioButton)
    //     label.appendChild(text)
    //     div.appendChild(label)
    //   })
    // }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
