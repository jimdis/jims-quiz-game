const template = document.createElement('template')
template.innerHTML = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
<div id="quiz-card">

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
    this._quizCard = this.shadowRoot.querySelector('#quiz-card')
    this.question = null
    this.answer = '2'
  }
  connectedCallback () {
    this._quizCard.textContent = 'Hello World again!'
    this.getQuestion()
    this.sendAnswer()
  }

  async sendAnswer () {
    let response = await this.postData(`http://vhost3.lnu.se:20080/answer/1`, { answer: 2 })
    console.log(response)
  }

  async postData (url, data) {
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
  }
}

// Registers the custom event
window.customElements.define('quiz-game', QuizGame)
