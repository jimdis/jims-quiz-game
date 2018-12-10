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
      .catch(error => {
        if (!window.navigator.onLine) {
          throw new Error('You seem to be offline. Please check your internet connection')
        } else throw new Error(error.message)
      })
    if (!response.ok) {
      throw new Error(`There was a problem with the server. Response status: ${response.status}`)
    } else {
      this.response = await response.json()
      this.url = this.response.nextURL
      this.alternatives = this.response.alternatives ? this.response.alternatives : null
      return this.response.question
    }
  }

  async sendAnswer (answer) {
    let response = await this.postData(this.url, { answer: answer })
      .catch((error) => {
        if (!window.navigator.onLine) {
          throw new Error('You seem to be offline. Please check your internet connection')
        } else throw new Error(error.message)
      })
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
    if (!response.ok) {
      if (response.status === 400) {
        this.wrongAnswer = true
      } else throw new Error(`There was a problem with the server. Response status: ${response.status}`)
    }
    response = await response.json()
    return response
  }
}
