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

  async getQuestion () {
    let response = await window.fetch(this.apiURL)
    response = await response.json()
    console.log(response)
    this.question = response.question
    this.apiURL = response.nextURL
    this._updateRendering(response)
    this.getAnswer(response)
  }

  searchAnswer (response) {
    let answer = 'ANSWER NOT CHANGED!'
    if (response.question && !response.alternatives) {
      console.log('FIRST IF ACTIVE!')
      let input = this._quizCard.querySelector('#input-number')
      answer = input.value
      console.log('Answer changed in first if to: ' + answer)
    }
    if (response.alternatives) {
      console.log('SECOND IF ACTIVE!')
      let alternatives = this._quizCard.querySelectorAll('[type=radio]')
      for (let alternative of Array.from(alternatives)) {
        alternative.addEventListener('change', () => {
          answer = alternative.value
          console.log('Answer changed in second if to: ' + answer)
        })
      }
    }
    return answer
  }
  getAnswer (response) {
    this._quizCard.querySelector('#button').addEventListener('click', async () => {
      let answer = this.searchAnswer(response)
      console.log('Answer submitted: ' + answer)
      let nextResponse = await this.postData(this.apiURL, { answer: answer })
      console.log(nextResponse)
      this.apiURL = nextResponse.nextURL
      this._updateRendering(nextResponse)
    })
  }

  async postData (url, data) {
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
        radioButton.setAttribute('name', 'alt')
        radioButton.setAttribute('type', 'radio')
        radioButton.setAttribute('value', key)
        label.appendChild(radioButton)
        label.appendChild(text)
        this._quizCard.insertBefore(label, this._quizCard.querySelector('#button'))
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
