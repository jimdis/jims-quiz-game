export default /* html */`
<link rel="stylesheet" href="../css/jims-quiz-game.css">
<form action="">
    <div id="startDiv">
        <h4>Please enter a nickname:</h4>
        <input type="text" name="playerName" id="inputName" autocomplete="off" placeholder="Your cool nickname here...">
    </div>
    <div id="questionDiv">
        <p id="timerLabel">Timer: <span id="timer"></span></p>
        <h4>Question:</h4>
        <h3 id="question"></h3>
        <h4>Your answer:</h4>
    </div>
    <div id="inputText">
      <input type="text" name="textAnswer" id="inputAnswer" autocomplete="off" placeholder="Type your answer here...">
    </div>
    <div id="inputRadio">
        <div id="radioButtons">
        </div>
    </div>
    <div id="answerDiv">
        <h3 id="serverAnswer"></h3>
    </div>
    <div id="gameOver">
        <h4>GAME OVER!</h4>
    </div>
    <div id="gameFinished">
        <h4>Congratulations! You passed the quiz!</h4>
        <h4 id="totalTime"></h4>
        <h3>High Score</h3>
        <table>
                <tr>
                    <th>Place</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Time</th>
                </tr>
            <tbody  id="highScoreTable">
            </tbody>
        </table>
    </div>

    <div id="timeOut">
        <h4>Time is out! Game Over!</h4>
    </div>
    <div id="error">
    <h4 id="errorMessage"></h4>
    </div>
    <button id="formButton" type="submit">BOILERPLATE</button>
</form>
`
