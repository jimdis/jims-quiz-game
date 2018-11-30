const template = document.createElement('template')
template.innerHTML = /* html */`
<!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
-->
<style>
  label {
    display: block;
  }
</style>
<div id="quiz-card">
<h3 id="question"></h3>
<label for="answer">Your answer:</label>
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

class QuizGame extends window.HTMLElement {
  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.apiURL = 'http://vhost3.lnu.se:20080/question/1'
    this._quizCard = this.shadowRoot.querySelector('#quiz-card')
    this.question = null
    this.questionID = 1
  }
  connectedCallback () {
    this.getQuestion()
  }

  getAnswer () {
    this._quizCard.querySelector('#button').addEventListener('click', async event => {
      let input = this._quizCard.querySelector('#input-number')
      let response = await this.postData(this.apiURL, { answer: input.value })
      console.log(response)
      this.apiURL = response.nextURL
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
    let response = await window.fetch(this.apiURL)
    response = await response.json()
    console.log(response)
    this.question = response.question
    this.apiURL = response.nextURL
    this._updateRendering(response)
    this.getAnswer()
  }

  _updateRendering (response) {
    let question = this._quizCard.querySelector('#question')
    let answer = this._quizCard.querySelector('#answer')
    if (response.question && !response.alternatives) {
      console.log('textQuestion')
    }
    if (response.alternatives) {
      Object.keys(response.alternatives).forEach((key) => { // GÅR NEDAN ATT GÖRA ENKLARE MED EN TEMPLATE?
        let label = document.createElement('label')
        let radioButton = document.createElement('input')
        let text = document.createTextNode(response.alternatives[key])
        radioButton.setAttribute('type', 'radio')
        radioButton.setAttribute('value', key)
        label.appendChild(radioButton)
        label.appendChild(text)
        this._quizCard.insertBefore(label, this._quizCard.querySelector('#button'))
        console.log('Key: ' + key + 'Value: ' + response.alternatives[key])
      })
    }
    question.textContent = this.question
    answer.textContent = ''
    if (!response.question) {
      answer.textContent = response.message
      setTimeout(() => { this.getQuestion() }, 1000)
    }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
