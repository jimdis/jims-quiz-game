/**
 * A class for handling server communication for the QuizGame
 *
 * @class API
 */
export default class API {
  constructor () {
    this.url = 'http://vhost3.lnu.se:20080/question/1'
  }

  async getQuestion () {
    let response = await window.fetch(this.url)
    this.response = await response.json()
    this.url = this.response.nextURL
    this.alternatives = this.response.alternatives ? this.response.alternatives : null
    return this.response.question
  }

  async sendAnswer (answer) {
    let response = await this.postData(this.url, { answer: answer })
    if (!response.nextURL && !this.wrongAnswer) {
      this.gameFinished = true
    }
    this.url = response.nextURL
    return response.message
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
      this.wrongAnswer = true
    }
    response = await response.json()
    return response
  }
}
