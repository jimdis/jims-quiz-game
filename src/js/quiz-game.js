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
  }
  connectedCallback () {
    this._quizCard.textContent = 'Hello World again!'
    this.getQuestion()
  }

  async getNextQuestion () {

  }

  async getQuestion () {
    let response = await window.fetch(`http://vhost3.lnu.se:20080/question/1`)
    response = await response.json()
    this.question = response.question
    console.log(this.question)
  }
}

// Registers the custom event
window.customElements.define('quiz-game', QuizGame)
