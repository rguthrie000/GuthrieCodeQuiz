// script.js for rguthrie's Coding Quiz
// 20191209

// see questions.js, which contains
// var questions =[{},...,{}];
//
// each object in the questions array has structure:
//  {q:"",a["","","",""],c:""}, 

// The design of this site is to establish dialog areas
// with overlapping content which can be switched on
// or off depending on the state of the quiz/game.  These 
// states are Start (waiting for player to start the quiz),
// Game (player is working through the questions of the 
// quiz, and Game Over (user quiz summary, and depending
// on score may be invited to post on the Top scores list).

//****************
//    Globals    *
//****************

// Handles for all required HTML elements 
// Start
var rulesListEl  = document.getElementById("rules");
var startBtnEl   = document.getElementById("startBtn");
var scoresBoxEl  = document.getElementById("scoresBox");
// Game
var timerEl      = document.getElementById("countdown");
var questionEl   = document.getElementById("question");
var answerListEl = document.getElementById("answers");
var answer0El    = document.getElementById("ans-0");
var answer1El    = document.getElementById("ans-1");
var answer2El    = document.getElementById("ans-2");
var answer3El    = document.getElementById("ans-3");
// Game Over
var resultEl     = document.getElementById("result");
var enterScoreEl = document.getElementById("enterScore");
var lastScoreEl  = document.getElementById("lastScore");
var playerNameEl = document.getElementById("playerName");
var addMeEl      = document.getElementById("addMe");
// Audio elements
var winnerEl     = document.getElementById("correctAudio");
var loserEl      = document.getElementById("wrongAudio");
var timeExpEl    = document.getElementById("timeoutAudio");
var top5AudioEl  = document.getElementById("top5Audio");

// Globals for game play
var gameClock;            // timer handle
var secondsRemaining = 0; // timer down-count
var qSequence = 0;        // position in the sequence of questions
var ansCorrect = 0;       // counter for correct answers
var score = -1;           // score of last game
var questions;            // 'questions' will hold a permutation of the
                          //   full set of Q&As held in questions.js

// State Machine states and state variable
const WAIT_FOR_START     = 0;
const Q_N_A              = 1;
const WAIT_FOR_SCORE_ACK = 2;
const ENTERING_TOP_FIVE  = 3;
var gameState = WAIT_FOR_START;

// Consequences of correct and wrong answers
const CORRECT_BONUS = 10; // seconds
const WRONG_PENALTY = 10; // seconds

//****************
//   Functions   *
//****************

// startPage() controls visibility and active states
// so the starting page is correctly displayed.
function startPage()
{
  // hide the Game and Game Over elements
  questionEl.style.display   = "none";
  answerListEl.style.display = "none";
  timerEl.style.display      = "none";
  resultEl.style.display     = "none";
  enterScoreEl.style.display = "none";
  // and disable their buttons
  answer0El.setAttribute("disabled", "true");
  answer1El.setAttribute("disabled", "true");
  answer2El.setAttribute("disabled", "true");
  answer3El.setAttribute("disabled", "true");
   resultEl.setAttribute("disabled", "true");
    addMeEl.setAttribute("disabled", "true");

  //reveal the Start elements
  rulesListEl.style.display  = "inline";
  startBtnEl.style.display   = "inline";
  //populate the scoresBox by altering the
  //children, who are un-named.
  for (let i = 0; i < highScores.length; i++)
  {
    var s = highScores[i].score;
    // note that the first child is the title, so we
    // start assigning at index 1.
    // first, alignment is provided in the box by 
    // adding leading zeros to the score.
    var sp = s > 99 ? "": (s > 9 ? "0":"00");
    scoresBoxEl.children[i+1].innerText = 
      (s == -1 ? "<empty>" : (sp+s+": "+highScores[i].player));
  }
  scoresBoxEl.style.display  = "inline";
}

// gamePage() configures the page for game action.
function gamePage()
{
  // hide the Start and Game Over elements
  rulesListEl.style.display  = "none";
  startBtnEl.style.display   = "none";
  scoresBoxEl.style.display  = "none";
  resultEl.style.display     = "none";
  enterScoreEl.style.display = "none";
  // reveal the Game elements
  timerEl.style.display      = "inline"
  questionEl.style.display   = "inline";
  answerListEl.style.display = "inline";
  // and activate the Game buttons
  answer0El.removeAttribute("disabled");
  answer1El.removeAttribute("disabled");
  answer2El.removeAttribute("disabled");
  answer3El.removeAttribute("disabled");
}

// gameOver() gathers all the close-out logic in one routine.
function gameOver()
{
  // Last question has been answered, and/or the clock has expired.
  // Stop the Clock!
  clearInterval(gameClock);
  // clear the textBox and timer
  questionEl.style.display   = "none";
  answerListEl.style.display = "none";
  timerEl.style.display      = "none";
  timerEl.textContent        = "";
  // the score is needed for the results box and the scoreBox. establish a 
  // minimum score of 0 (the score may have gone negative at the end of 
  // the game due to a wrong-answer penalty)
  score = secondsRemaining < 0 ? 0 : secondsRemaining;
  // show the result box
  resultEl.style.display     = "inline";
  resultEl.textContent = 
    `${ansCorrect} of ${questions.length}! Score: ${score}. <click to return>`;
  // and enable the result box as a button  
  resultEl.removeAttribute("disabled");
  // post the score in the scores box for viewing on the start page
  lastScoreEl.textContent = `Your last score: ${score}`;

  // the default next state is WAIT_FOR_SCORE_ACK, where we require
  // the player to click on the results box to get back to the Start.
  gameState = WAIT_FOR_SCORE_ACK;
  // but we may change that assignment, if the player did not time out
  // and the score is in the Top 5.
  if (score == 0)
  {
    // If the game timed out, play the time-expired sound
    timeExpEl.play();
  }
  else if (score > highScores[highScores.length-1].score)
  {
    // to get here means score is above zero and score is 
    // greater than the lowest score in the Top 5.  we only need to check
    // the last position in highScores because highScores is kept sorted
    // in descending order -- the last position holds the smallest number.
    // So...Top 5! show and enable the dialog, and play the celebration clip.
    enterScoreEl.style.display = "inline";
    addMeEl.removeAttribute("disabled");
    gameState = ENTERING_TOP_FIVE;
    top5AudioEl.play();
  }
}

// clockTick() services the 1 second interval timer.
function clockTick() 
{
  // wrong answer penalties may take secondsRemaining to <= 0
  if (secondsRemaining > 0)
  {
  // update the countdown and write it to the page.
  timerEl.textContent = --secondsRemaining + " s";
  }
  // reckoning the last second may have taken 
  // secondsRemaining to 0.
  if (secondsRemaining < 1) 
  {
    gameOver();
  }
}

// buttonClick() is the game state machine.  All buttons vector
// here.  This function is called in response to a click, so the game
// state is set in advance of entry.  the game state will change 
// during execution based on the game logic...for example, in 
// WAIT_FOR_START, receiving a START click will cause the state to
// transition to Q_N_A, which is the game state.  gameState is set 
// to WAIT_FOR_START *before* the first button click can happen.
function buttonClick() 
{
  // postQnA() is an embedded function to avoid repeating code at
  // multiple points in the State Machine.
  function postQnA()
  {
    // Post the question
    questionEl.textContent = qSequence +". " + questions[qSequence].title;
    // and the answers
    for (let i = 0; i < 4; i++) 
    {
      answerListEl.children[i].textContent = `> ${questions[qSequence].choices[i]}`;
    }
  }

  // begin body of buttonClick()

  //What was clicked?...get the button value
  var choice = event.target.value;
  
  //State Machine
  switch (gameState)
  {
    case WAIT_FOR_START:
      if (choice == "start")
      {
        // got the start click, so initialize the game.
        // start with the display
        gamePage();
        // then start the clock
        secondsRemaining = 100.0;
        gameClock = setInterval(clockTick,1000.0);
        // and post the first question
        ansCorrect = 0;
        qSequence = 0;
        postQnA();
        // get ready for the first answer
        gameState = Q_N_A;
      }
      break;
    case Q_N_A:
      // an answer has been received.  is it correct?
      if (questions[qSequence].choices[choice] == questions[qSequence].answer)
      {
        // got it right!  add bonus time, count as correct, and play the clip.
        secondsRemaining += CORRECT_BONUS;
        ansCorrect++;
        winnerEl.play();
      }
      else
      {
        // uh oh, the player chose poorly.
        secondsRemaining -= WRONG_PENALTY;
        loserEl.play();
      }

      if (++qSequence < questions.length)
      {
        // Put up the next Question & Answers
        postQnA();
      }
      else
      {
        // done with Q&A, so clean up and leave -- gameOver() will 
        // set the state to either WAIT_FOR_SCORE_ACK or ENTERING_TOP_FIVE.
        gameOver();
      }
      break;
    case WAIT_FOR_SCORE_ACK:
      // Game is over, results are displayed -- but score did not justify
      // high score.  We're waiting for a click of the results button.
      if (choice == "resultSeen")
      {
        // ok, outta here. change the display back to Start.
        startPage();
        gameState = WAIT_FOR_START;
      }
      break;
    case ENTERING_TOP_FIVE:
      // User's score is not zero and is higher than any score in the Top 5.
      // Wait for either the addMe button or the results button.
      if (choice == "addMe")
      {
        // overwrite the lowest score in highScores, then re-sort
        // the array before committing the updated list to local storage.

        // get the text field from the form.
        var newName = playerNameEl.value;
        // and test it for content -- if none, don't change the Top 5.
        if (newName)
        {
          highScores[highScores.length-1].score = score;
          highScores[highScores.length-1].player= newName;
          // the sort will arrange the score objects in decreasing order
          // by score. so we know the last object always holds the lowest score.
          highScores.sort(function(a,b) {return(b.score-a.score)});
          // write to the space reserved for us by the Browser.
          localStorage.setItem('highScores',JSON.stringify(highScores));
        }
      }
      // whether a new highscore was recorded or not, exit on addMe or 
      // resultSeen, which comes as a button value from the results box.
      if (choice == "addMe" || choice == "resultSeen")
      {
        startPage();
        gameState = WAIT_FOR_START;
      }
      break;  
  }  
  
}

//******************
//   Global code   *
//******************

// vector all buttons to buttonClick()
document.getElementById("startBtn"  ).addEventListener("click", buttonClick);
document.getElementById("answers"   ).addEventListener("click", buttonClick);
document.getElementById("result"    ).addEventListener("click", buttonClick);
document.getElementById("addMe"     ).addEventListener("click", buttonClick);

// fetch the highScore list from local storage.
// if none, initialize the internal copy, but don't store it
// unless/until a new score is obtained through gameplay.
var highScores = JSON.parse(localStorage.getItem("highScores"));
if (!highScores)
{
  highScores = 
  [
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
  ];  
}    

// sort the list of questions randomly so the game is using 
// a different permutation each time.  the callback function
// assigned as the sorting criterion positive values, negative values,
// and, very rarely, a value of zero.
questions = questionsArray.sort
(
  function()
  {
    return(Math.random()-0.5);
  }
);

// questions are in place, saved highScores (if any) are in place, the
// initial HTML/CSS is drawn.  Time to start this party.
startPage();

