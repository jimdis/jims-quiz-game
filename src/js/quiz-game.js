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
<h4>Your answer:</h4>
<div id="input-div">
</div>
<button id="button">Send Answer</button>
<h3 id="server-answer"></h3>
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
    this.response = null
  }

  connectedCallback () {
    this._quizCard.querySelector('#button').addEventListener('click', async () => {
      let answer = this.getAnswer()
      console.log('Answer submitted: ' + answer)
      this.response = await this.postData(this.apiURL, { answer: answer })
      this.apiURL = this.response.nextURL
      this._updateRendering()
    })
    this.getQuestion()
  }

  async getQuestion () {
    let response = await window.fetch(this.apiURL)
    this.response = await response.json()
    this.apiURL = this.response.nextURL
    this._updateRendering()
  }

  getAnswer () {
    let answer = 'ANSWER NOT CHANGED!'
    if (this.response.question && !this.response.alternatives) {
      console.log('FIRST IF ACTIVE!')
      let input = this._quizCard.querySelector('#input-text')
      answer = input.value
      console.log('Answer changed in first if to: ' + answer)
    }
    if (this.response.alternatives) {
      console.log('SECOND IF ACTIVE!')
      let alternatives = this._quizCard.querySelectorAll('[type=radio]')
      for (let alternative of Array.from(alternatives)) {
        if (alternative.checked) {
          answer = alternative.value
        }
      }
      console.log('Answer changed in second if to: ' + answer)
    }
    return answer
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

  _updateRendering () {
    let question = this._quizCard.querySelector('#question')
    let serverAnswer = this._quizCard.querySelector('#server-answer')
    let div = this._quizCard.querySelector('#input-div')
    div.innerHTML = ''
    console.log(this.response)
    if (this.response.question && !this.response.alternatives) {
      console.log('THIS IS INTERPRETED AS A TEXT QUESTION!')
      let input = document.createElement('input')
      input.setAttribute('type', 'text')
      input.setAttribute('id', 'input-text')
      div.appendChild(input)
    }
    if (this.response.alternatives) {
      console.log('THIS IS INTERPRETED AS AN ALTERNATIVES QUESTION!')
      Object.keys(this.response.alternatives).forEach((key) => { // GÅR NEDAN ATT GÖRA ENKLARE MED EN TEMPLATE?
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
    question.textContent = this.response.question
    serverAnswer.textContent = ''
    if (!this.response.question) {
      serverAnswer.textContent = this.response.message
      setTimeout(() => { this.getQuestion() }, 1000)
    }
  }
}

// Registers the custom event
window.customElements.define('jims-quiz-game', QuizGame)
