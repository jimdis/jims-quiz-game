const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
<div id="quiz-card">
<h3 id="question"></h3>
<label for "answer">Your answer:</label>
<input type="number" id="input-number" name ="answer">
<button id="button">Send Answer</button>
<h3 id="answer"></h3>
</div>
`

/**
 * A Quiz game component
 *
 * @class QuizGame
 * @extends {window.HTMLElement}
 */

export class QuizGame extends window.HTMLElement {
  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this._apiURL = 'http://vhost3.lnu.se:20080/'
    this._quizCard = this.shadowRoot.querySelector('#quiz-card')
    this.question = null
  }
  connectedCallback () {
    this.getQuestion()
  }

  getAnswer () {
    this._quizCard.querySelector('#button').addEventListener('click', async event => {
      let input = this._quizCard.querySelector('#input-number')
      let response = await this.postData(`${this._apiURL}answer/1`, { answer: input.value }) // GLÖM EJ ändra till question number
      console.log(response)
      this._updateRendering(response)
    })
  }

  async postData (url, data) {
    console.log('Data: ' + data)
    console.log('JSON: ' + JSON.stringify(data))
    let response = await window.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    response = await response.json()
    return response
  }

  async getQuestion () {
    let response = await window.fetch(`http://vhost3.lnu.se:20080/question/1`)
    response = await response.json()
    this.question = response.question
    this._updateRendering()
    this.getAnswer()
  }

  _updateRendering (response) {
    this._quizCard.querySelector('#question').textContent = this.question
    if (response) {
      this._quizCard.querySelector('#answer').textContent = response.message
    }
  }
}

// Registers the custom event
window.customElements.define('quiz-game', QuizGame)
