/**
 * A class for handling server communication for the QuizGame
 *
 * @class API
 */
export default class API {
  constructor () {
    this.url = 'http://vhost3.lnu.se:20080/question/1'
  }

  /**
   * Contacts server to get new question
   * @returns {string} - A question from the server.
   * @throws {Error} Message depending on the error detected (network down or server response)
   * @memberof API
   */

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

  /**
   * Sends answer to server.
   *
   * @param {string} answer - The answer to be sent to the server
   * @returns {string} - The response message from the server
   * @memberof API
   */
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

  /**
   * Posts data in JSON to the server.
   *
   * @param {string} url - The url to send the data
   * @param {string} data - The data to be sent to the server
   * @throws {Error} - Status response from server if fetch was not ok
   * @returns {Object} - The response from the server
   * @memberof API
   */
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
